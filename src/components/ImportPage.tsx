/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, ArrowRight, CornerDownLeft } from 'lucide-react';

interface ImportPageProps {
  isDarkMode: boolean;
}

type ImportStatus = 'checking-session' | 'importing' | 'success' | 'error';

export default function ImportPage({ isDarkMode }: ImportPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<ImportStatus>('checking-session');
  const [error, setError] = useState<string | null>(null);
  const [importedName, setImportedName] = useState<string>('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus('error');
      setError('Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.');
      return;
    }

    // Check user authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // Not logged in. Redirect to login page with a helpful message and target return url.
        const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`/login?message=Please log in to import your V Astra Spreadsheet&redirectTo=${currentUrl}`);
      } else {
        // Logged in! Verify and perform the import.
        if (token) {
          performImport(session.user.id, token);
        } else {
          setStatus('error');
          setError('Missing token parameter in the URL. Please provide a valid import token link.');
        }
      }
    }).catch((err) => {
      console.error('Session check error:', err);
      setStatus('error');
      setError(err.message || 'An error occurred while validating your active cloud session.');
    });
  }, [token, navigate]);

  const performImport = async (userId: string, importToken: string) => {
    setStatus('importing');
    try {
      // 1. Fetch the temporary spreadsheet from the temporary_exports table using token (UUID)
      let { data: tempData, error: fetchError } = await supabase
        .from('temporary_exports')
        .select('*')
        .eq('id', importToken)
        .maybeSingle();

      // Fallback query if 'id' column doesn't exist (checking for 'token' column alternative)
      if (fetchError && fetchError.message?.includes('column "id" does not exist')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('temporary_exports')
          .select('*')
          .eq('token', importToken)
          .maybeSingle();

        if (fallbackError) {
          throw new Error(`Failed to fetch temporary spreadsheet data (fallback): ${fallbackError.message}`);
        }
        tempData = fallbackData;
      } else if (fetchError) {
        throw new Error(`Failed to fetch temporary spreadsheet data: ${fetchError.message}`);
      }

      if (!tempData) {
        throw new Error('No temporary spreadsheet data was found for this token. It may have expired or already been imported.');
      }

      // 2. Extract and format spreadsheet name and payload data
      const sheetName = tempData.name || tempData.title || tempData.file_name || 'Imported V Astra Spreadsheet';
      const sheetsDataPayload = tempData.sheets_data || tempData.data || tempData.payload || tempData.spreadsheet_data || tempData;

      setImportedName(sheetName);

      let parsedSheetsData = sheetsDataPayload;
      if (typeof sheetsDataPayload === 'string') {
        try {
          parsedSheetsData = JSON.parse(sheetsDataPayload);
        } catch (e) {
          console.error('Failed parsing temporary sheets_data payload, keeping as string:', e);
        }
      }

      // 3. Insert this data into the main spreadsheets (vortex_sheets) table, assigned to user's user_id
      const { error: insertError } = await supabase
        .from('vortex_sheets')
        .insert([
          {
            user_id: userId,
            name: sheetName,
            sheets_data: parsedSheetsData,
          }
        ]);

      if (insertError) {
        throw new Error(`Failed to save spreadsheet to your account: ${insertError.message}`);
      }

      // 4. Clean up: immediately delete the temporary row from the temporary_exports table
      let { error: deleteError } = await supabase
        .from('temporary_exports')
        .delete()
        .eq('id', importToken);

      // Fallback delete if column 'id' doesn't exist
      if (deleteError && deleteError.message?.includes('column "id" does not exist')) {
        const { error: fallbackDeleteError } = await supabase
          .from('temporary_exports')
          .delete()
          .eq('token', importToken);
        deleteError = fallbackDeleteError;
      }

      if (deleteError) {
        console.warn('Could not delete temporary import row from Supabase:', deleteError.message);
      }

      // 5. Successful import triggers visual finish
      setStatus('success');

      // Automatically redirect to dashboard (workspace) after 2.5 seconds
      setTimeout(() => {
        window.location.href = '/'; // Performs a clean browser reload to fetch new sheet from mount state
      }, 2500);

    } catch (err: any) {
      console.error('Import process failed:', err);
      setStatus('error');
      setError(err.message || 'An error occurred while importing your spreadsheet.');
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between p-4 font-sans transition-colors duration-150 ${
      isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-slate-800'
    }`}>
      {/* Mini Header Row */}
      <div className="w-full max-w-md mx-auto flex items-center pt-2">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            isDarkMode 
              ? 'hover:bg-zinc-900 text-zinc-400 hover:text-orange-400' 
              : 'hover:bg-gray-150 text-slate-500 hover:text-orange-600'
          }`}
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
          <span>Back to Workspace</span>
        </button>
      </div>

      {/* Main Status Container Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className={`rounded-3xl border p-6 sm:p-8 shadow-xl transition-all duration-300 ${
          isDarkMode ? 'bg-zinc-900 border-zinc-805' : 'bg-white border-zinc-150'
        }`}>
          {/* 1. CHECKING SESSION / INITIAL LOADING */}
          {status === 'checking-session' && (
            <div className="flex flex-col items-center text-center space-y-5 py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin relative" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-extrabold tracking-tight">Verifying Secure Access</h2>
                <p className={`text-xs max-w-xs ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Checking your secure login status before retrieving your V Astra spreadsheet.
                </p>
              </div>
            </div>
          )}

          {/* 2. IMPORTING STATE */}
          {status === 'importing' && (
            <div className="flex flex-col items-center text-center space-y-5 py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/25 rounded-full blur-2xl animate-pulse" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg relative animate-bounce">
                  <FileSpreadsheet className="w-8 h-8 text-white stroke-[2]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-extrabold tracking-tight animate-pulse">Importing V Astra Sheet...</h2>
                <p className={`text-xs max-w-xs leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Fetching temporary data, parsing cells, and saving to your permanent cloud account portfolio.
                </p>
              </div>
              <div className="h-1.5 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-progress" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          {/* 3. SUCCESS STATE */}
          {status === 'success' && (
            <div className="flex flex-col items-center text-center space-y-5 py-2">
              <div className="p-3.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-14 h-14 text-emerald-500 stroke-[2.5]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black tracking-tight">Spreadsheet imported successfully!</h2>
                <p className={`text-xs px-2 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  The spreadsheet <strong className="text-orange-500 dark:text-orange-400">{importedName || 'V Astra Document'}</strong> is now synchronized permanently with your profile workspace.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold leading-relaxed w-full flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Redirecting to your dashboard...</span>
              </div>

              <button
                onClick={() => {
                  window.location.href = '/';
                }}
                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-zinc-950 font-extrabold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <span>Go to Workspace Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 4. ERROR STATE */}
          {status === 'error' && (
            <div className="flex flex-col items-center text-center space-y-5 py-2">
              <div className="p-3.5 bg-red-500/10 rounded-full border border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500 stroke-[2.5]" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-extrabold tracking-tight">Import Failed</h2>
                <p className="text-xs text-red-500 font-semibold px-1 leading-relaxed">
                  {error || 'An unexpected error prevented the spreadsheet from being imported successfully.'}
                </p>
              </div>

              <div className={`p-4 rounded-xl text-[11px] leading-relaxed text-left border ${
                isDarkMode ? 'bg-zinc-950/40 border-zinc-800 text-zinc-400' : 'bg-orange-50/20 border-orange-100/50 text-slate-500'
              }`}>
                <span className="font-extrabold text-orange-600 dark:text-orange-400 block mb-0.5">💡 Troubleshooting Import:</span>
                Please ensure you clicked a valid, non-expired temporary spreadsheet link. If the spreadsheet was already imported by you or another session, the temporary token has been securely discarded.
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full py-3 text-xs font-bold rounded-xl border transition-all cursor-pointer border-zinc-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                Return to Spreadsheet Workspace
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Brand Footer Info Line */}
      <div className="w-full max-w-md mx-auto text-center text-[10px] text-zinc-400 dark:text-zinc-500 font-mono py-2 select-none">
        VortexSheets Cloud Portability Services v4.0
      </div>
    </div>
  );
}
