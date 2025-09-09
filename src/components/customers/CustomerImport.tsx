import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { parseCSV, validateCustomerRow, downloadSampleCSV, validateAndSeparateRows, csvRowToCustomer } from '../../utils/csvParser';
import { CUSTOMER_IMPORT_FIELDS } from '../../types/csvImport';
import type { 
  CSVImportPreview, 
  CSVImportValidationError, 
  CSVImportResult 
} from '../../types/csvImport';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'results';

// Helper function to deduplicate customers within a batch based on email (when present)
function deduplicateBatch(customers: any[]): any[] {
  const seen = new Map();
  const deduplicated: any[] = [];
  
  for (const customer of customers) {
    // Create a key for deduplication - use email if present, otherwise allow duplicate null emails
    const key = customer.email ? `${customer.user_id}-${customer.email}` : `${customer.user_id}-${Math.random()}`;
    
    if (!seen.has(key)) {
      seen.set(key, true);
      deduplicated.push(customer);
    }
    // If duplicate found within batch, skip it (it will be counted as a duplicate)
  }
  
  return deduplicated;
}

export function CustomerImport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<CSVImportPreview | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<CSVImportValidationError[]>([]);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importOnlyValid, setImportOnlyValid] = useState(false);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const preview = parseCSV(text);
      
      if (preview.rows.length === 0) {
        throw new Error('CSV file contains no data rows');
      }

      setCsvData(preview);
      setCurrentStep('mapping');
      
      // Auto-map common field names
      const autoMapping: Record<string, string> = {};
      preview.headers.forEach(header => {
        const lowerHeader = header.toLowerCase().trim();
        
        // Common field mappings
        if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
          autoMapping[header] = 'first_name';
        } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
          autoMapping[header] = 'last_name';
        } else if (lowerHeader.includes('email')) {
          autoMapping[header] = 'email';
        } else if (lowerHeader.includes('phone')) {
          autoMapping[header] = 'phone';
        } else if (lowerHeader.includes('company')) {
          autoMapping[header] = 'company_name';
        } else if (lowerHeader.includes('street') || lowerHeader.includes('address')) {
          autoMapping[header] = 'address_street';
        } else if (lowerHeader.includes('city')) {
          autoMapping[header] = 'address_city';
        } else if (lowerHeader.includes('state')) {
          autoMapping[header] = 'address_state';
        } else if (lowerHeader.includes('zip') || lowerHeader.includes('postal')) {
          autoMapping[header] = 'address_zip';
        } else if (lowerHeader.includes('note')) {
          autoMapping[header] = 'notes';
        }
      });
      
      setFieldMapping(autoMapping);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate mapping and preview data
  const handlePreview = () => {
    if (!csvData) return;

    const errors: CSVImportValidationError[] = [];
    
    // Check if required fields are mapped
    const requiredFields = CUSTOMER_IMPORT_FIELDS.filter(f => f.required);
    const mappedFields = Object.values(fieldMapping);
    
    requiredFields.forEach(field => {
      if (!mappedFields.includes(field.key)) {
        errors.push({
          row: 0,
          field: field.key,
          value: '',
          message: `Required field "${field.label}" must be mapped`
        });
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Validate each row
    csvData.rows.forEach((row, index) => {
      const rowErrors = validateCustomerRow(row, fieldMapping, index + 1);
      errors.push(...rowErrors);
    });

    setValidationErrors(errors);
    setCurrentStep('preview');
  };

  // Start import process
  const handleImport = async () => {
    if (!csvData || !user) return;

    setCurrentStep('importing');
    setIsLoading(true);

    try {
      let rowsToProcess = csvData.rows;

      // If importing only valid rows and there are validation errors
      if (importOnlyValid && validationErrors.length > 0) {
        const validationResult = validateAndSeparateRows(csvData.rows, fieldMapping);
        rowsToProcess = validationResult.validRows;
      }

      // Convert CSV rows to customer objects
      const customers = rowsToProcess.map((row, index) => {
        const customer = csvRowToCustomer(row, fieldMapping);
        const customerWithMeta = {
          ...customer,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Debug: Log the first customer to verify all fields are included
        if (index === 0) {
          console.log('Sample customer data being imported:', customerWithMeta);
          console.log('Field mapping:', fieldMapping);
        }
        
        return customerWithMeta;
      });

      // Batch insert customers with upsert to handle duplicates
      const batchSize = 500;
      let totalInserted = 0;
      let totalErrors = 0;
      let totalDuplicates = 0;
      const errors: any[] = [];

      for (let i = 0; i < customers.length; i += batchSize) {
        const rawBatch = customers.slice(i, i + batchSize);
        
        // Deduplicate within the batch to prevent "cannot affect row a second time" error
        const batch = deduplicateBatch(rawBatch);
        
        // Track how many were deduplicated within this batch
        const batchDuplicatesRemoved = rawBatch.length - batch.length;
        totalDuplicates += batchDuplicatesRemoved;
        
        try {
          // Use upsert to handle duplicates gracefully with the correct constraint
          const { data, error } = await supabase
            .from('customers')
            .upsert(batch as any, { 
              onConflict: 'user_id,email',
              ignoreDuplicates: false 
            })
            .select('id');

          if (error) {
            console.error('Batch insert error:', error);
            
            // Handle specific error cases
            if (error.code === '21000') {
              // This error should not occur anymore due to batch deduplication,
              // but if it does, it means there are still duplicates in the batch
              throw new Error(`Duplicate entries found within the same batch. This indicates a data issue in your CSV file.`);
            } else if (error.code === '23505') {
              // If it's a constraint error, try individual inserts to identify duplicates
              let batchInserted = 0;
              let batchDuplicates = 0;
              
              for (const customer of batch) {
                try {
                  const { data: singleData, error: singleError } = await supabase
                    .from('customers')
                    .insert([customer] as any)
                    .select('id');
                    
                  if (singleError) {
                    if (singleError.code === '23505') {
                      batchDuplicates++;
                    } else {
                      console.error('Single insert error:', singleError);
                    }
                  } else {
                    batchInserted += singleData?.length || 0;
                  }
                } catch (singleErr) {
                  console.error('Single insert exception:', singleErr);
                }
              }
              
              totalInserted += batchInserted;
              totalDuplicates += batchDuplicates;
            } else {
              totalErrors += batch.length;
              errors.push({
                batchStart: i + 1,
                error: error.message
              });
            }
          } else {
            totalInserted += data?.length || 0;
          }
        } catch (err) {
          console.error('Batch processing error:', err);
          totalErrors += batch.length;
          errors.push({
            batchStart: i + 1,
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      // Set import results
      setImportResult({
        success: totalErrors === 0,
        importedCount: totalInserted,
        errorCount: totalErrors,
        duplicates: totalDuplicates,
        skippedRows: importOnlyValid ? validationErrors.length : 0,
        errors: errors.map((error, index) => ({
          row: error.batchStart || index + 1,
          field: 'unknown',
          value: 'unknown',
          message: error.error
        }))
      });
      
      setCurrentStep('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setCurrentStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to start over
  const handleReset = () => {
    setCsvData(null);
    setFieldMapping({});
    setValidationErrors([]);
    setImportResult(null);
    setError(null);
    setCurrentStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStepIcon = (step: ImportStep) => {
    switch (step) {
      case 'upload':
        return <DocumentArrowUpIcon className="h-5 w-5" />;
      case 'mapping':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'preview':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'importing':
        return <ArrowPathIcon className="h-5 w-5 animate-spin" />;
      case 'results':
        return <CheckCircleIcon className="h-5 w-5" />;
    }
  };

  const isStepCompleted = (step: ImportStep) => {
    const steps: ImportStep[] = ['upload', 'mapping', 'preview', 'importing', 'results'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);
    return stepIndex < currentIndex || (step === 'results' && currentStep === 'results');
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Import Customers
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Upload a CSV file to import multiple customers at once
            </p>
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {(['upload', 'mapping', 'preview', 'results'] as ImportStep[]).map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep === step
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : isStepCompleted(step)
                    ? 'border-green-600 bg-green-600 text-white'
                    : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                }`}
              >
                {getStepIcon(step)}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep === step
                    ? 'text-blue-600 dark:text-blue-400'
                    : isStepCompleted(step)
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
              {index < 3 && (
                <div
                  className={`w-16 h-0.5 mx-4 ${
                    isStepCompleted(step) ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="p-8">
            <div className="text-center">
              <DocumentArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Upload CSV File
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Select a CSV file containing your customer data
              </p>
              
              <div className="space-y-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                    Choose CSV File
                  </label>
                </div>
                
                <button
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Download Sample CSV
                </button>
              </div>
            </div>
            
            {isLoading && (
              <div className="mt-6 text-center">
                <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600 mx-auto" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Parsing CSV file...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Field Mapping Step */}
        {currentStep === 'mapping' && csvData && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Map CSV Fields
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Match your CSV columns to customer fields. Found {csvData.totalRows} rows.
            </p>
            
            <div className="space-y-4">
              {csvData.headers.map(header => (
                <div key={header} className="flex items-center space-x-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      CSV Column: <span className="font-mono text-blue-600">{header}</span>
                    </label>
                  </div>
                  <div className="w-1/3">
                    <select
                      value={fieldMapping[header] || ''}
                      onChange={(e) =>
                        setFieldMapping(prev => ({
                          ...prev,
                          [header]: e.target.value
                        }))
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">-- Skip this column --</option>
                      {CUSTOMER_IMPORT_FIELDS.map(field => (
                        <option key={field.key} value={field.key}>
                          {field.label} {field.required && '*'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-1/3 text-sm text-gray-500 dark:text-gray-400">
                    Sample: {csvData.rows[0]?.[header] || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Start Over
              </button>
              <button
                onClick={handlePreview}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Preview Import
              </button>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {currentStep === 'preview' && csvData && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Preview Import
            </h3>
            
            {validationErrors.length > 0 && (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Validation Issues ({validationErrors.length})
                </h4>
                <div className="max-h-40 overflow-y-auto">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                      Row {error.row}: {error.message}
                    </p>
                  ))}
                  {validationErrors.length > 10 && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                      ... and {validationErrors.length - 10} more issues
                    </p>
                  )}
                </div>
                
                {/* Option to import only valid rows */}
                <div className="mt-4 border-t border-yellow-200 dark:border-yellow-800 pt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importOnlyValid}
                      onChange={(e) => setImportOnlyValid(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-yellow-800 dark:text-yellow-200">
                      Import only valid rows ({csvData.totalRows - validationErrors.length} of {csvData.totalRows} rows)
                    </span>
                  </label>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Rows with validation errors will be skipped during import
                  </p>
                </div>
              </div>
            )}
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {Object.entries(fieldMapping).filter(([, field]) => field).map(([csvCol, field]) => {
                        const fieldDef = CUSTOMER_IMPORT_FIELDS.find(f => f.key === field);
                        return (
                          <th
                            key={csvCol}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            {fieldDef?.label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {csvData.rows.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {Object.entries(fieldMapping).filter(([, field]) => field).map(([csvCol]) => (
                          <td
                            key={csvCol}
                            className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                          >
                            {row[csvCol] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.rows.length > 5 && (
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 text-center">
                  Showing first 5 of {csvData.rows.length} rows
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep('mapping')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Back to Mapping
              </button>
              <button
                onClick={handleImport}
                disabled={validationErrors.length > 0 && !importOnlyValid}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validationErrors.length > 0 && importOnlyValid 
                  ? `Import ${csvData.totalRows - validationErrors.length} Valid Customers`
                  : `Import ${csvData.rows.length} Customers`
                }
              </button>
            </div>
          </div>
        )}

        {/* Importing Step */}
        {currentStep === 'importing' && (
          <div className="p-8 text-center">
            <ArrowPathIcon className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Importing Customers...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we process your customer data
            </p>
          </div>
        )}

        {/* Results Step */}
        {currentStep === 'results' && importResult && (
          <div className="p-6">
            <div className="text-center mb-6">
              <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Import Complete!
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {importResult.importedCount}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Successfully Imported
                </div>
              </div>
              
              {importResult.errorCount > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {importResult.errorCount}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    Errors
                  </div>
                </div>
              )}
              
              {importResult.skippedRows && importResult.skippedRows > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {importResult.skippedRows}
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    Validation Errors Skipped
                  </div>
                </div>
              )}
              
              {importResult.duplicates && importResult.duplicates > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {importResult.duplicates}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Duplicates Skipped
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/customers')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Customers
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Import More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
