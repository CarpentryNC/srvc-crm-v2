# CSV Customer Import

This feature allows users to bulk import customer data from CSV files through a professional multi-step interface.

## Features

### 🎯 **Multi-Step Import Process**
1. **File Upload** - Drag & drop or select CSV files
2. **Field Mapping** - Smart auto-mapping with manual adjustments  
3. **Data Preview** - Validation and preview before import
4. **Bulk Processing** - Server-side processing via Edge Function
5. **Results Summary** - Detailed import statistics and error reporting

### 📊 **Smart Features**
- **Auto-mapping** of common field names (First Name, Last Name, Email, etc.)
- **Real-time validation** with error highlighting
- **Duplicate detection** based on email addresses
- **Sample CSV download** for proper formatting
- **Progress tracking** with visual step indicators

### 🔒 **Data Validation**
- Required field validation (First Name, Last Name, Email)
- Email format validation
- Phone number format validation
- Duplicate prevention within import and existing data
- Row-by-row error reporting

### 📁 **CSV Format Support**
The import supports the following customer fields:
- **Required**: First Name, Last Name, Email
- **Optional**: Phone, Company Name, Street Address, City, State, ZIP Code, Notes

## Usage

### From the UI:
1. Navigate to **Customers** → **Import CSV**
2. Upload your CSV file or download the sample template
3. Map CSV columns to customer fields (auto-mapping included)
4. Preview and validate your data
5. Import customers with one click

### Sample CSV Format:
```csv
First Name,Last Name,Email,Phone,Company Name,Street Address,City,State,ZIP Code,Notes
John,Smith,john.smith@example.com,(555) 123-4567,Acme Corp,123 Main St,Anytown,CA,12345,VIP customer
Jane,Doe,jane.doe@company.com,(555) 987-6543,Tech Solutions Inc,456 Oak Ave,Springfield,NY,67890,Referred by John Smith
```

## Technical Implementation

### Frontend Components
- `CustomerImport.tsx` - Main import interface with step management
- `csvParser.ts` - CSV parsing and validation utilities
- `csvImport.ts` - TypeScript types and field definitions

### Backend Processing
- **Supabase Edge Function**: `supabase/functions/import-customers/index.ts`
- Handles bulk insertion with proper error handling
- Prevents duplicates and validates data server-side
- Returns detailed import statistics

### Key Features:
- **Type Safety**: Full TypeScript integration
- **Error Handling**: Comprehensive validation and error reporting  
- **Performance**: Server-side bulk processing
- **Security**: User authentication and data isolation
- **UX**: Professional multi-step interface with progress tracking

## Deployment

### Deploy Edge Function:
```bash
supabase functions deploy import-customers
```

### Required Environment Variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key (for Edge Function)

## Error Handling

The import process provides detailed error reporting:
- **Field validation errors** with specific row numbers
- **Duplicate detection** with skip counts
- **Format validation** for emails and phone numbers
- **Success metrics** showing imported vs. failed records

## Future Enhancements

- [ ] Export existing customers to CSV
- [ ] Import job and quote data
- [ ] Advanced field mapping with custom transformations
- [ ] Scheduled imports via API
- [ ] Import history and rollback functionality
