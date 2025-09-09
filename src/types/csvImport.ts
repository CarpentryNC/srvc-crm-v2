// CSV Import types for customer data

export interface CSVImportField {
  key: string;
  label: string;
  required: boolean;
  type: 'text' | 'email' | 'phone' | 'date';
  example?: string;
}

export interface CSVImportMapping {
  csvColumn: string;
  customerField: string;
}

export interface CSVImportRow {
  [key: string]: string;
}

export interface CSVImportPreview {
  headers: string[];
  rows: CSVImportRow[];
  totalRows: number;
}

export interface CSVImportValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface CSVImportResult {
  success: boolean;
  importedCount: number;
  errorCount: number;
  errors: CSVImportValidationError[];
  duplicates?: number;
}

export interface CSVImportStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  newCustomers: number;
  existingCustomers: number;
}

// Available customer fields for mapping
export const CUSTOMER_IMPORT_FIELDS: CSVImportField[] = [
  {
    key: 'first_name',
    label: 'First Name',
    required: true,
    type: 'text',
    example: 'John'
  },
  {
    key: 'last_name',
    label: 'Last Name',
    required: true,
    type: 'text',
    example: 'Smith'
  },
  {
    key: 'email',
    label: 'Email',
    required: true,
    type: 'email',
    example: 'john.smith@example.com'
  },
  {
    key: 'phone',
    label: 'Phone',
    required: false,
    type: 'phone',
    example: '(555) 123-4567'
  },
  {
    key: 'company_name',
    label: 'Company Name',
    required: false,
    type: 'text',
    example: 'Acme Corp'
  },
  {
    key: 'address_street',
    label: 'Street Address',
    required: false,
    type: 'text',
    example: '123 Main St'
  },
  {
    key: 'address_city',
    label: 'City',
    required: false,
    type: 'text',
    example: 'Anytown'
  },
  {
    key: 'address_state',
    label: 'State',
    required: false,
    type: 'text',
    example: 'CA'
  },
  {
    key: 'address_zip',
    label: 'ZIP Code',
    required: false,
    type: 'text',
    example: '12345'
  },
  {
    key: 'notes',
    label: 'Notes',
    required: false,
    type: 'text',
    example: 'Additional customer information'
  }
];
