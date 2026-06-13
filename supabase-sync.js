/**
 * Supabase Sync Module
 * Handles bidirectional data sync between Glydus CRM and Supabase
 * - Migrates localStorage data to Supabase on first run
 * - Polls Supabase for changes and updates the UI
 * - Queues offline changes and syncs when reconnected
 */

class SupabaseSync {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
    this.pendingChanges = [];
    this.lastSyncTime = {};
    this.userId = null;
    this.supabase = null;
  }

  /**
   * Initialize Supabase client and start sync
   */
  async initialize() {
    try {
      const { createClient } = window.supabase;
      const url = window.GLYDUS_SUPABASE_CONFIG?.url;
      const anonKey = window.GLYDUS_SUPABASE_CONFIG?.anonKey;

      if (!url || !anonKey) {
        console.warn(
          "[Sync] Supabase config not found. Sync disabled.",
        );
        return false;
      }

      this.supabase = createClient(url, anonKey);

      // Get current user session
      const {
        data: { session },
      } = await this.supabase.auth.getSession();

      if (!session) {
        console.warn("[Sync] No user session. Cannot initialize sync.");
        return false;
      }

      this.userId = session.user.id;
      console.log("[Sync] Initialized with user:", this.userId);

      // Perform initial migration
      await this.migrateLocalStorageData();

      // Start polling for changes
      this.startPolling();

      return true;
    } catch (error) {
      console.error("[Sync] Initialization error:", error);
      return false;
    }
  }

  /**
   * Migrate data from localStorage to Supabase on first run
   */
  async migrateLocalStorageData() {
    try {
      const migrationKey = `sync_migrated_${this.userId}`;
      const alreadyMigrated = localStorage.getItem(migrationKey);

      if (alreadyMigrated) {
        console.log("[Sync] Data already migrated, skipping...");
        return;
      }

      console.log("[Sync] Starting data migration...");

      // Get data from localStorage
      const leadsData = localStorage.getItem("leads");
      const leads = leadsData ? JSON.parse(leadsData) : [];

      if (leads.length === 0) {
        console.log("[Sync] No data to migrate.");
        localStorage.setItem(migrationKey, "true");
        return;
      }

      // Migrate contacts
      for (const lead of leads) {
        try {
          await this.supabase.from("contacts").upsert(
            {
              user_id: this.userId,
              lead_id: lead.id,
              name: lead.contactName || "",
              email: lead.email || "",
              phone: lead.phone || "",
              source: lead.source || "CRM",
              priority: lead.priority || "Cold",
              stage: lead.stage || "New Lead",
              notes: lead.notes || "",
            },
            { onConflict: "user_id,lead_id" },
          );
        } catch (error) {
          console.error("[Sync] Error migrating contact:", lead.id, error);
        }
      }

      console.log("[Sync] Migration completed: " + leads.length + " leads migrated");
      localStorage.setItem(migrationKey, "true");
    } catch (error) {
      console.error("[Sync] Migration error:", error);
    }
  }

  /**
   * Start polling for Supabase changes
   */
  startPolling() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Poll every 10 seconds
    this.syncInterval = setInterval(async () => {
      await this.poll();
    }, 10000);

    // Also do an immediate poll
    this.poll();
  }

  /**
   * Poll Supabase for changes
   */
  async poll() {
    if (this.isSyncing || !this.userId) return;

    try {
      this.isSyncing = true;

      // Fetch updated contacts
      const { data: contacts, error: contactsError } =
        await this.supabase
          .from("contacts")
          .select("*")
          .eq("user_id", this.userId);

      if (contactsError) throw contactsError;

      if (contacts && contacts.length > 0) {
        this.syncContactsToApp(contacts);
      }

      // Sync any pending changes
      await this.syncPendingChanges();
    } catch (error) {
      console.error("[Sync] Polling error:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync contacts from Supabase to app
   */
  syncContactsToApp(contacts) {
    try {
      // Convert Supabase contacts back to localStorage format
      const leads = contacts.map((contact) => ({
        id: contact.lead_id,
        contactName: contact.name,
        email: contact.email,
        phone: contact.phone,
        source: contact.source,
        priority: contact.priority,
        stage: contact.stage,
        notes: contact.notes,
        companyName: contact.name, // Use name as company for display
        nextAction: contact.notes || "Follow up",
      }));

      // Get current leads from localStorage
      const currentLeads = JSON.parse(localStorage.getItem("leads") || "[]");
      const currentLeadIds = new Set(currentLeads.map((l) => l.id));

      // Merge: keep local non-synced leads, add/update synced ones
      const mergedLeads = [];
      const syncedIds = new Set(contacts.map((c) => c.lead_id));

      // Add synced leads (from Supabase)
      for (const lead of leads) {
        mergedLeads.push(lead);
      }

      // Add local leads that aren't synced yet
      for (const localLead of currentLeads) {
        if (!syncedIds.has(localLead.id)) {
          mergedLeads.push(localLead);
        }
      }

      // Update localStorage
      localStorage.setItem("leads", JSON.stringify(mergedLeads));

      // Trigger UI update
      if (window.refreshLeadsDisplay) {
        window.refreshLeadsDisplay();
      }

      console.log("[Sync] Synced " + mergedLeads.length + " contacts to app");
    } catch (error) {
      console.error("[Sync] Error syncing contacts:", error);
    }
  }

  /**
   * Queue a change to be synced
   */
  queueChange(type, data) {
    this.pendingChanges.push({
      type,
      data,
      timestamp: Date.now(),
    });
    console.log("[Sync] Queued change:", type);
  }

  /**
   * Sync pending changes to Supabase
   */
  async syncPendingChanges() {
    if (this.pendingChanges.length === 0) return;

    const changes = [...this.pendingChanges];
    this.pendingChanges = [];

    for (const change of changes) {
      try {
        if (change.type === "contact_add" || change.type === "contact_update") {
          const contact = change.data;
          await this.supabase.from("contacts").upsert(
            {
              user_id: this.userId,
              lead_id: contact.id,
              name: contact.contactName || "",
              email: contact.email || "",
              phone: contact.phone || "",
              source: contact.source || "CRM",
              priority: contact.priority || "Cold",
              stage: contact.stage || "New Lead",
              notes: contact.notes || "",
            },
            { onConflict: "user_id,lead_id" },
          );
          console.log("[Sync] Synced contact:", contact.id);
        } else if (change.type === "contact_delete") {
          await this.supabase
            .from("contacts")
            .delete()
            .eq("user_id", this.userId)
            .eq("lead_id", change.data.id);
          console.log("[Sync] Deleted contact:", change.data.id);
        }
      } catch (error) {
        console.error("[Sync] Error syncing change:", change.type, error);
        // Re-queue the change for retry
        this.pendingChanges.push(change);
      }
    }
  }

  /**
   * Manually sync contact to Supabase
   */
  async syncContact(contact) {
    if (!this.userId) {
      console.warn("[Sync] No user ID, cannot sync contact");
      return false;
    }

    try {
      const { error } = await this.supabase.from("contacts").upsert(
        {
          user_id: this.userId,
          lead_id: contact.id,
          name: contact.contactName || "",
          email: contact.email || "",
          phone: contact.phone || "",
          source: contact.source || "CRM",
          priority: contact.priority || "Cold",
          stage: contact.stage || "New Lead",
          notes: contact.notes || "",
        },
        { onConflict: "user_id,lead_id" },
      );

      if (error) throw error;
      console.log("[Sync] Contact synced:", contact.id);
      return true;
    } catch (error) {
      console.error("[Sync] Error syncing contact:", error);
      return false;
    }
  }

  /**
   * Delete contact from Supabase
   */
  async deleteContact(contactId) {
    if (!this.userId) {
      console.warn("[Sync] No user ID, cannot delete contact");
      return false;
    }

    try {
      const { error } = await this.supabase
        .from("contacts")
        .delete()
        .eq("user_id", this.userId)
        .eq("lead_id", contactId);

      if (error) throw error;
      console.log("[Sync] Contact deleted:", contactId);
      return true;
    } catch (error) {
      console.error("[Sync] Error deleting contact:", error);
      return false;
    }
  }

  /**
   * Stop polling
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("[Sync] Polling stopped");
    }
  }
}

// Create global instance
window.supabaseSync = new SupabaseSync();
