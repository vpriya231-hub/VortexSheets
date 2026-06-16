import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Cloud,
  Check,
  Copy,
  LogOut,
  Database,
  AlertCircle,
  Key,
  ShieldAlert,
  FolderOpen,
  Plus,
  RefreshCw,
  Trash2,
  FileCheck,
  Globe
} from 'lucide-react';
import { supabase, isSupabaseConfigured, SUPABASE_TABLE_SCHEMA } from '../utils/supabaseClient';

interface SupabaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  currentSheetsData: any; // The payload structure from App state
  onLoadSheetsFromCloud: (cloudSheets: any[], docId: string, docName: string) => void;
  onSaveTrigger: () => Promise<void>; // Prop to trigger manual sync from App
  activeCloudFileId?: string | null;
  onClearActiveCloudFile?: () => void;
}

export default function SupabaseAuthModal({
  isOpen,
  onClose,
  isDarkMode,
  currentSheetsData,
  onLoadSheetsFromCloud,
  onSaveTrigger,
  activeCloudFileId = null,
  onClearActiveCloudFile
}: SupabaseAuthModalProps) {
  // Authentication states
  const [session, setSession] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Cloud persistence states
  const [cloudSheetsList, setCloudSheetsList] = useState<any[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');

  // Auto-subscribe to auth changes if Supabase is available
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchCloudSheets(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchCloudSheets(session.user.id);
      } else {
        setCloudSheetsList([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch sheets stored in cloud
  const fetchCloudSheets = async (userId: string) => {
    if (!isSupabaseConfigured) return;
    setCloudLoading(true);
    try {
      const { data, error } = await supabase
        .from('vortex_sheets')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching cloud sheets:', error);
      } else if (data) {
        setCloudSheetsList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCloudLoading(false);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_TABLE_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  // Perform Email Login or Registration
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    if (!email || !password) {
      setAuthError('Please fill in both email and password fields.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setAuthSuccess('Logged in successfully!');
        if (data.session) {
          fetchCloudSheets(data.session.user.id);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setAuthSuccess('Registration successful! Please check your email for confirmation or log in.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during authentication.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Perform Log Out
  const handleLogout = async () => {
    if (!isSupabaseConfigured) return;
    setAuthLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      setAuthSuccess('Logged out successfully.');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Save/Publish active spreadsheet state to Supabase
  const handlePublishActiveSheet = async () => {
    if (!isSupabaseConfigured || !session) return;
    setCloudLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    const sheetName = newSheetName.trim() || 'My Spreadsheet';

    try {
      const { data, error } = await supabase
        .from('vortex_sheets')
        .insert([
          {
            user_id: session.user.id,
            name: sheetName,
            sheets_data: currentSheetsData,
          }
        ])
        .select();

      if (error) throw error;

      setAuthSuccess(`"${sheetName}" created and synced to Supabase!`);
      setNewSheetName('');
      fetchCloudSheets(session.user.id);
    } catch (err: any) {
      setAuthError(err.message || 'Error occurred saving spreadsheet.');
    } finally {
      setCloudLoading(false);
    }
  };

  // Update an existing saved document on the cloud
  const handleOverwriteDataOnCloud = async (docId: string, docName: string) => {
    if (!isSupabaseConfigured || !session) return;
    if (!window.confirm(`Are you sure you want to write your current local spreadsheet contents into your cloud document "${docName}"?`)) {
      return;
    }

    setCloudLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const { error } = await supabase
        .from('vortex_sheets')
        .update({
          sheets_data: currentSheetsData,
          updated_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;

      setAuthSuccess(`"${docName}" was updated successfully on the cloud.`);
      fetchCloudSheets(session.user.id);
    } catch (err: any) {
      setAuthError(err.message || 'Error syncing to document.');
    } finally {
      setCloudLoading(false);
    }
  };

  // Load spreadsheet state from Supabase to current app state
  const handleLoadSheetFromCloud = async (row: any) => {
    if (!row || !row.id || !session) return;
    if (!window.confirm(`Swap current spreadsheet workspace with "${row.name}"? Unsaved working changes will be overwritten.`)) {
      return;
    }

    setCloudLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      const { data, error } = await supabase
        .from('vortex_sheets')
        .select('*')
        .eq('id', row.id)
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      if (!data || !data.sheets_data) {
        throw new Error('No spreadsheet sheets_data payload found for this backup.');
      }

      let payload = data.sheets_data;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch (e) {
          console.error('Failed to parse sheets_data field in handleLoadSheetFromCloud:', e);
        }
      }

      onLoadSheetsFromCloud(payload, data.id, data.name);
      setAuthSuccess(`Loaded "${data.name}" successfully!`);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || 'Error occurred loading spreadsheet from cloud.');
    } finally {
      setCloudLoading(false);
    }
  };

  // Delete a cloud document
  const handleDeleteCloudSheet = async (e: React.MouseEvent, docId: string, name: string) => {
    e.stopPropagation();
    if (!isSupabaseConfigured || !session) return;
    if (!window.confirm(`Are you absolutely sure you want to delete the cloud document "${name}"? This action cannot be undone.`)) {
      return;
    }

    setCloudLoading(true);
    try {
      const { error } = await supabase
        .from('vortex_sheets')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      setAuthSuccess(`"${name}" deleted from cloud storage.`);
      
      // Clear current file tracking if deleted
      if (activeCloudFileId === docId && onClearActiveCloudFile) {
        onClearActiveCloudFile();
      }
      
      fetchCloudSheets(session.user.id);
    } catch (err: any) {
      setAuthError(err.message || 'Error deleting sheet.');
    } finally {
      setCloudLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 ${
        isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-gray-200 text-gray-800'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-150 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-orange-500 animate-pulse" />
            <h2 className="text-base font-semibold">VortexCloud Cloud Sync</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Contents */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-left">
          
          {/* Status Indicators */}
          {authError && (
            <div className="p-3 bg-red-100/10 border border-red-500/20 text-red-500 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 bg-emerald-100/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Conditional Layout: Supabase Missing Credentials */}
          {!isSupabaseConfigured ? (
            <div className="space-y-4">
              <div className="p-4 bg-orange-100/10 border border-orange-500/20 rounded-2xl flex flex-col items-center text-center gap-2">
                <ShieldAlert className="w-8 h-8 text-orange-500 opacity-80" />
                <h3 className="text-sm font-semibold">Supabase Keys Not Configured</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed leading-normal">
                  VortexSheets supports fully automated real-time background cloud persistence. To persist sheets across devices without any risk of local storage wipes, configure your Supabase credentials!
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-zinc-400 text-[10px] uppercase font-mono tracking-wider">How to setup cloud database:</span>
                <ol className="list-decimal list-inside space-y-1 text-zinc-500 dark:text-zinc-400 pl-1 leading-relaxed">
                  <li>Go to your Supabase Dashboard and create a new project.</li>
                  <li>Click on the settings tab or search for your <strong className="text-zinc-700 dark:text-zinc-200">Session/Anon API Key</strong> and project URL.</li>
                  <li>Add them to your environment variables in settings:
                    <ul className="list-disc list-inside pl-4 font-mono text-[10px] text-orange-500">
                      <li>VITE_SUPABASE_URL</li>
                      <li>VITE_SUPABASE_ANON_KEY</li>
                    </ul>
                  </li>
                  <li>In your Supabase SQL Editor, run the schema setup script below.</li>
                </ol>
              </div>

              {/* Collapsed schema copy */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center pr-1">
                  <span className="font-semibold text-[10px] text-orange-500 font-mono flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" /> Supabase SQL Schema setup script
                  </span>
                  <button
                    onClick={handleCopySchema}
                    className="flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 rounded text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    {copiedSchema ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedSchema ? 'Copied' : 'Copy Schema'}
                  </button>
                </div>
                <pre className={`p-3 rounded-lg border text-[9px] font-mono overflow-x-auto max-h-36 ${
                  isDarkMode ? 'bg-zinc-950 border-zinc-850 text-emerald-500' : 'bg-gray-50 border-gray-150 text-emerald-700'
                }`}>
                  {SUPABASE_TABLE_SCHEMA}
                </pre>
              </div>
            </div>
          ) : (
            // Supabase is Configured! Show either Login/SignUp form OR Cloud File Sync center
            <div>
              {!session ? (
                /* Auth Form (Login or SignUp) */
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className={`flex-1 py-1.5 rounded-lg text-center font-bold text-xs select-none cursor-pointer transition-all ${
                        authMode === 'login'
                          ? 'bg-white dark:bg-zinc-700 shadow text-orange-600 dark:text-orange-400'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('signup')}
                      className={`flex-1 py-1.5 rounded-lg text-center font-bold text-xs select-none cursor-pointer transition-all ${
                        authMode === 'signup'
                          ? 'bg-white dark:bg-zinc-700 shadow text-orange-600 dark:text-orange-400'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                      }`}
                    >
                      Sign Up
                    </button>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-2.5 opacity-40" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@domain.com"
                          className="w-full pl-9 pr-3 py-2 border rounded-xl outline-none focus:border-orange-500 transition-colors bg-transparent border-gray-200 dark:border-zinc-800 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-2.5 opacity-40" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-3 py-2 border rounded-xl outline-none focus:border-orange-500 transition-colors bg-transparent border-gray-200 dark:border-zinc-800 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 cursor-pointer text-white font-bold text-xs rounded-xl transition-all shadow-md flex justify-center items-center gap-1.5"
                  >
                    {authLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    {authMode === 'login' ? 'Sign In to Cloud' : 'Create Cloud Account'}
                  </button>

                  <div className="text-center text-[10px] opacity-50 py-1 font-mono">
                    Secured by Supabase Auth (PostgreSQL Encryption)
                  </div>

                  {/* Privacy & Terms Links */}
                  <div className="pt-2.5 border-t border-gray-150 dark:border-zinc-800/60 flex items-center justify-center gap-3 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                    <a 
                      href="https://sites.google.com/view/vortexsheets-privacy-policy/home" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-orange-500 hover:underline transition-colors focus:outline-none"
                    >
                      Privacy Policy
                    </a>
                    <span className="text-zinc-300 dark:text-zinc-800">•</span>
                    <a 
                      href="https://sites.google.com/view/vortexsheetstermsandconditions/home" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-orange-500 hover:underline transition-colors focus:outline-none"
                    >
                      Terms & Conditions
                    </a>
                  </div>
                </form>
              ) : (
                /* Cloud Synchronization Dashboard */
                <div className="space-y-4">
                  {/* Logged in User Bar */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    isDarkMode ? 'bg-zinc-950 border-zinc-850' : 'bg-gray-50 border-gray-150'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold font-mono">
                        {session.user.email?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate max-w-[180px]">{session.user.email}</p>
                        <p className="text-[10px] opacity-40 font-mono truncate">ID: {session.user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 px-3 py-1.5 hover:bg-red-500 hover:text-white dark:hover:bg-red-950/40 text-red-500 rounded-lg text-xs font-semibold cursor-pointer transition-all border border-red-500/20"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>

                  {/* Save Active Workspace to cloud */}
                  <div className="space-y-2">
                    <span className="font-semibold text-zinc-400 text-[10px] uppercase font-mono tracking-wider">Upload Current Workspace</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSheetName}
                        onChange={(e) => setNewSheetName(e.target.value)}
                        placeholder="Name of cloud spreadsheet, e.g. Q2 Ledger"
                        className="flex-1 px-3 py-2 border rounded-xl outline-none focus:border-orange-500 transition-colors bg-transparent border-gray-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200"
                      />
                      <button
                        onClick={handlePublishActiveSheet}
                        disabled={cloudLoading}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all shadow shrink-0"
                      >
                        {cloudLoading ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        Upload New
                      </button>
                    </div>
                  </div>

                  {/* Cloud Documents Catalog and Sync Options */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-400 text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
                        <FolderOpen className="w-3.5 h-3.5 text-orange-500" /> Your Cloud Spreadsheet Backups ({cloudSheetsList.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => fetchCloudSheets(session.user.id)}
                        className="p-1 rounded text-zinc-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-zinc-800 cursor-pointer"
                        title="Reload catalog"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${cloudLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {cloudSheetsList.length === 0 ? (
                        <div className={`p-6 text-center text-zinc-400 border border-dashed rounded-xl ${
                          isDarkMode ? 'border-zinc-800 bg-zinc-950/20' : 'border-gray-200 bg-gray-50/50'
                        }`}>
                          <FileCheck className="w-6 h-6 mx-auto mb-1 opacity-40 text-orange-400" />
                          No spreadsheets saved in cloud database yet. Name and upload above to back up!
                        </div>
                      ) : (
                        cloudSheetsList.map((row) => (
                          <div
                            key={row.id}
                            onClick={() => handleLoadSheetFromCloud(row)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all relative group ${
                              isDarkMode 
                                ? 'bg-zinc-950 border-zinc-850 hover:bg-zinc-800' 
                                : 'bg-gray-50 hover:bg-orange-50/20 border-gray-150 hover:border-orange-200'
                            }`}
                          >
                            <div className="min-w-0 pr-6">
                              <p className="font-bold text-xs truncate text-orange-600 dark:text-orange-400 group-hover:underline">
                                {row.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-zinc-500">
                                <span>Updated: {new Date(row.updated_at).toLocaleDateString()} {new Date(row.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span>•</span>
                                <span>Tabs: {(Array.isArray(row.sheets_data) ? row.sheets_data.length : row.sheets_data?.sheets?.length) || 1}</span>
                              </div>
                            </div>
                            
                            {/* Actions layout inside list item */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOverwriteDataOnCloud(row.id, row.name);
                                }}
                                className="p-1 text-[10px] bg-orange-500/10 hover:bg-orange-500 text-orange-600 dark:text-orange-400 hover:text-white rounded font-mono font-bold cursor-pointer transition-colors"
                                title="Overwrite with your current spreadsheet on screen"
                              >
                                Overwrite Cloud
                              </button>
                              <button
                                onClick={(e) => handleDeleteCloudSheet(e, row.id, row.name)}
                                className="p-1 px-1.5 hover:bg-red-500/10 hover:text-red-500 text-zinc-400 rounded cursor-pointer transition-colors"
                                title="Delete backup"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Realtime aut-save banner info */}
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2">
                    <Globe className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed text-zinc-650 dark:text-zinc-350">
                      <strong>Real-time Cloud Sync is Active</strong>: We will automatically back up your cell modifications immediately to the cloud if you loaded one of your saved files from this panel.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-150 dark:border-zinc-800 flex justify-end">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 hover:bg-orange-600 bg-orange-500 text-white font-semibold rounded-xl text-xs cursor-pointer transition-all shadow-md"
          >
            Close Control Center
          </button>
        </div>
      </div>
    </div>
  );
}
