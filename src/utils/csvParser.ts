// CSV parsing utilities for customer import

import type { CSVImportRow, CSVImportPreview, CSVImportValidationError } from '../types/csvImport';
import { CUSTOMER_IMPORT_FIELDS } from '../types/csvImport';
import type { Customer } from '../types/customer';

/**
 * Parse CSV file content into structured data
 */
export function parseCSV(csvContent: string): CSVImportPreview {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse headers (first row)
  const headers = parseCSVRow(lines[0]);
  
  if (headers.length === 0) {
    throw new Error('CSV file has no headers');
  }

  // Parse data rows
  const rows: CSVImportRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) { // Skip empty lines
      const values = parseCSVRow(line);
      const row: CSVImportRow = {};
      
      // Map values to headers, handling cases where row has different length than headers
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }
  }

  return {
    headers,
    rows,
    totalRows: rows.length
  };
}

/**
 * Parse a single CSV row, handling quoted values and commas
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < row.length) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current.trim());

  // Clean up quoted values
  return result.map(field => {
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1);
    }
    return field;
  });
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format - accepts various common formats
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Phone is optional
  
  // Remove all whitespace and common separators for validation
  const cleaned = phone.replace(/[\s\-\(\)\+\.\u200E\u200F]/g, '');
  
  // Must contain at least 10 digits, allow up to 15 for international
  const digitsOnly = cleaned.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Clean and format phone number
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  // Remove all non-digit characters except + at the beginning
  let cleaned = phone.replace(/[\s\-\(\)\.\u200E\u200F]/g, '');
  
  // Keep + only at the beginning
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.slice(1).replace(/\+/g, '');
  } else {
    cleaned = cleaned.replace(/\+/g, '');
  }
  
  return cleaned;
}

/**
 * Validate a single row of customer data
 */
export function validateCustomerRow(
  row: CSVImportRow, 
  mapping: Record<string, string>,
  rowIndex: number
): CSVImportValidationError[] {
  const errors: CSVImportValidationError[] = [];

  // Check required fields from configuration
  const requiredFields = CUSTOMER_IMPORT_FIELDS.filter(field => field.required).map(field => field.key);
  
  // Get values for validation
  const getFieldValue = (fieldKey: string) => {
    const csvColumn = Object.keys(mapping).find(key => mapping[key] === fieldKey);
    return csvColumn ? (row[csvColumn]?.trim() || '') : '';
  };

  const firstName = getFieldValue('first_name');
  const lastName = getFieldValue('last_name');
  const companyName = getFieldValue('company_name');

  requiredFields.forEach(field => {
    const csvColumn = Object.keys(mapping).find(key => mapping[key] === field);
    const value = csvColumn ? (row[csvColumn]?.trim() || '') : '';
    
    if (!value) {
      let message = `${field.replace('_', ' ')} is required`;
      
      // Provide helpful suggestions for missing names
      if (field === 'first_name' && !firstName && companyName) {
        message = `First name is required. Consider using company name "${companyName}" or "N/A" as placeholder.`;
      } else if (field === 'last_name' && !lastName && (firstName || companyName)) {
        if (firstName && companyName) {
          message = `Last name is required. Consider using company name "${companyName}" or "N/A" as placeholder.`;
        } else if (firstName) {
          message = `Last name is required for "${firstName}". Consider using "N/A" as placeholder.`;
        }
      }
      
      errors.push({
        row: rowIndex,
        field,
        value,
        message
      });
    }
  });

  // Validate email format
  const emailColumn = Object.keys(mapping).find(key => mapping[key] === 'email');
  if (emailColumn && row[emailColumn]) {
    const email = row[emailColumn].trim();
    if (email && !isValidEmail(email)) {
      errors.push({
        row: rowIndex,
        field: 'email',
        value: email,
        message: 'Invalid email format'
      });
    }
  }

  // Validate phone format
  const phoneColumn = Object.keys(mapping).find(key => mapping[key] === 'phone');
  if (phoneColumn && row[phoneColumn]) {
    const phone = row[phoneColumn].trim();
    if (phone && !isValidPhone(phone)) {
      errors.push({
        row: rowIndex,
        field: 'phone',
        value: phone,
        message: 'Invalid phone number format'
      });
    }
  }

  return errors;
}

/**
 * Convert CSV row to customer object based on field mapping
 */
export function csvRowToCustomer(
  row: CSVImportRow,
  mapping: Record<string, string>
): Partial<Customer> {
  const customer: any = {};

  Object.keys(mapping).forEach(csvColumn => {
    const customerField = mapping[csvColumn];
    let value = row[csvColumn]?.trim() || '';

    // Apply field-specific formatting
    switch (customerField) {
      case 'email':
        value = value.toLowerCase();
        break;
      case 'phone':
        value = formatPhone(value);
        break;
      case 'first_name':
      case 'last_name':
        value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        break;
    }

    if (value) {
      customer[customerField] = value;
    }
  });

  return customer;
}

/**
 * Generate sample CSV content for download
 */
export function generateSampleCSV(): string {
  const headers = [
    'First Name',
    'Last Name', 
    'Email',
    'Phone',
    'Company Name',
    'Street Address',
    'City',
    'State',
    'ZIP Code',
    'Notes'
  ];

  const sampleRows = [
    [
      'John',
      'Smith',
      'john.smith@example.com',
      '(555) 123-4567',
      'Acme Corp',
      '123 Main St',
      'Anytown',
      'CA',
      '12345',
      'VIP customer'
    ],
    [
      'Jane',
      'Doe',
      'jane.doe@company.com',
      '(555) 987-6543',
      'Tech Solutions Inc',
      '456 Oak Ave',
      'Springfield',
      'NY',
      '67890',
      'Referred by John Smith'
    ]
  ];

  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    )
  ].join('\n');

  return csvContent;
}

/**
 * Download sample CSV file
 */
export function downloadSampleCSV(): void {
  const csvContent = generateSampleCSV();
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'customer_import_sample.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  window.URL.revokeObjectURL(url);
}
