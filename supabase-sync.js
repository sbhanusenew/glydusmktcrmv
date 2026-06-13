/**
 * Supabase Sync Engine for Glydus CRM
 * Handles bidirectional sync between app and Supabase database
 * - NO authentication required (uses anonymous access with RLS)
 * - Migrates localStorage data to Supabase on first run
 * - Polls Supabase for changes and updates the UI
 * - Syncs every change to Supabase immediately
 */

class SupabaseSync {
  constructor() {
    this.supabase = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.pollInterval = null;
    this.pollRate = 5000; // 5 seconds
    this.userId = null;
    this.syncInProgress = false;
    this.lastPollTime = 0;
  }

  /**
   * Initialize Supabase connection and start sync
   */
  async initialize() {
    if (this.isInitialized || this.isInitializing) {
      console.log("[Sync] Already initialized or initializing");
      return;
    }

    this.isInitializing = true;
    console.log("[Sync] Starting initialization...");

    try {
      // Get config
      const config = window.GLYDUS_SUPABASE_CONFIG;
      if (!config || !config.url || !config.anonKey) {
        console.error("[Sync] Missing Supabase config");
        this.isInitializing = false;
        return;
      }

      // Initialize Supabase client
      const { createClient } = window.supabase;
      this.supabase = createClient(config.url, config.anonKey);
      console.log("[Sync] Supabase client created");

      // Generate user ID (no auth required)
      this.userId = this.getOrCreateUserId();
      console.log("[Sync] User ID:", this.userId);

      // Perform initial sync - migrate existing data
      await this.performInitialSync();

      // Start polling for remote changes
      this.startPolling();

      this.isInitialized = true;
      console.log("[Sync] Initialization complete!");
    } catch (error) {
      console.error("[Sync] Initialization failed:", error);
      this.isInitializing = false;
    }
  }

  /**
   * Generate or retrieve user ID (browser-based, no auth needed)
   */
  getOrCreateUserId() {
    const key = "glydus-sync-user-id";
    let userId = localStorage.getItem(key);
    
    if (!userId) {
      userId = this.generateUUID();
      localStorage.setItem(key, userId);
      console.log("[Sync] Generated new user ID");
    }
    
    return userId;
  }

  /**
   * Generate UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Perform initial sync - migrate localStorage data to Supabase
   */
  async performInitialSync() {
    console.log("[Sync] Starting initial sync...");
    
    try {
      // Get existing data from localStorage
      const storeJson = localStorage.getItem("glydus-crm-store-v2");
      if (!storeJson) {
        console.log("[Sync] No data in localStorage yet");
        return;
      }

      const store = JSON.parse(storeJson);
      const leads = store.leads || [];
      
      if (leads.length === 0) {
        console.log("[Sync] No leads to migrate");
        return;
      }

      console.log(`[Sync] Found ${leads.length} leads to migrate`);

      // Migrate each lead to Supabase
      for (const lead of leads) {
        await this.syncContactToSupabase(lead);
      }

      console.log("[Sync] Initial migration complete!");
    } catch (error) {
      console.error("[Sync] Initial sync failed:", error);
    }
  }

  /**
   * Sync a contact to Supabase
   */
  async syncContactToSupabase(lead) {
    if (!this.supabase || !this.userId) {
      console.warn("[Sync] Not initialized, cannot sync");
      return;
    }

    try {
      // Map app lead format to Supabase contacts format
      const leadId = lead.id || lead.lead_id || this.generateUUID();
      const contactData = {
        user_id: this.userId,
        lead_id: leadId,
        name: lead.contactName || lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source || "CRM",
        priority: lead.priority || "Cold",
        stage: lead.stage || "New Lead",
        notes: lead.notes || lead.description || "",
        updated_at: new Date().toISOString(),
      };

      console.log("[Sync] Syncing contact to Supabase:", leadId);

      // Upsert: update if exists, insert if new
      const { data, error } = await this.supabase
        .from('contacts')
        .upsert(contactData, { onConflict: 'user_id,lead_id' })
        .select();

      if (error) {
        console.error("[Sync] Error syncing contact:", error);
        return false;
      }

      console.log("[Sync] Contact synced successfully:", leadId);
      return true;
    } catch (error) {
      console.error("[Sync] Sync contact error:", error);
      return false;
    }
  }

  /**
   * Start polling for remote changes from Supabase
   */
  startPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    console.log(`[Sync] Starting polling every ${this.pollRate}ms`);

    // First poll immediately
    this.pollForChanges();

    // Then poll periodically
    this.pollInterval = setInterval(() => {
      this.pollForChanges();
    }, this.pollRate);
  }

  /**
   * Poll for changes from Supabase and update app
   */
  async pollForChanges() {
    if (!this.isInitialized || this.syncInProgress || !this.supabase) {
      return;
    }

    try {
      this.syncInProgress = true;

      // Fetch all contacts for this user from Supabase
      const { data: contacts, error } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('user_id', this.userId);

      if (error) {
        console.warn("[Sync] Polling error:", error.message);
        this.syncInProgress = false;
        return;
      }

      if (!contacts || contacts.length === 0) {
        console.log("[Sync] No contacts from Supabase");
        this.syncInProgress = false;
        return;
      }

      // Get current leads from app localStorage
      const storeJson = localStorage.getItem("glydus-crm-store-v2") || "{}";
      const store = JSON.parse(storeJson);
      const currentLeads = store.leads || [];

      // Check for new or updated contacts from Supabase
      let hasChanges = false;
      for (const contact of contacts) {
        const existingLead = currentLeads.find(
          lead => (lead.id || lead.lead_id) === contact.lead_id
        );

        if (!existingLead) {
          // New contact from Supabase - add to app
          const newLead = {
            id: contact.lead_id,
            lead_id: contact.lead_id,
            contactName: contact.name,
            email: contact.email,
            phone: contact.phone,
            source: contact.source,
            priority: contact.priority,
            stage: contact.stage,
            notes: contact.notes,
            description: contact.notes,
            companyName: contact.name,
            created_at: contact.created_at,
          };

          currentLeads.push(newLead);
          hasChanges = true;
          console.log("[Sync] New contact from Supabase:", contact.lead_id);
        } else if (contact.updated_at && new Date(contact.updated_at) > new Date(existingLead.updated_at || 0)) {
          // Existing contact was updated in Supabase - update app
          existingLead.contactName = contact.name;
          existingLead.email = contact.email;
          existingLead.phone = contact.phone;
          existingLead.source = contact.source;
          existingLead.priority = contact.priority;
          existingLead.stage = contact.stage;
          existingLead.notes = contact.notes;
          existingLead.description = contact.notes;
          existingLead.updated_at = contact.updated_at;
          hasChanges = true;
          console.log("[Sync] Updated contact from Supabase:", contact.lead_id);
        }
      }

      // Save updated leads to localStorage
      if (hasChanges) {
        store.leads = currentLeads;
        localStorage.setItem("glydus-crm-store-v2", JSON.stringify(store));
        console.log("[Sync] Updated localStorage with Supabase changes");

        // Trigger UI refresh if function exists
        if (window.refreshLeadsDisplay) {
          console.log("[Sync] Triggering UI refresh");
          window.refreshLeadsDisplay();
        }
      }

      this.syncInProgress = false;
    } catch (error) {
      console.error("[Sync] Poll error:", error);
      this.syncInProgress = false;
    }
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      console.log("[Sync] Polling stopped");
    }
  }
}

// Create global instance
window.supabaseSync = new SupabaseSync();

console.log("[Sync] Sync module loaded");

