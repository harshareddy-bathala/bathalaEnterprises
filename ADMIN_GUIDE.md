# Admin Setup & Management Guide

## 🔐 Administrator Guide for Bathala Enterprises

This comprehensive guide explains how to set up admin access and manage properties and services through the admin dashboard.

---

## Table of Contents

1. [Creating Your First Admin Account](#creating-your-first-admin-account)
2. [Logging In](#logging-in)
3. [Dashboard Overview](#dashboard-overview)
4. [Managing Properties](#managing-properties)
5. [Managing Services](#managing-services)
6. [Viewing Inquiries](#viewing-inquiries)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Creating Your First Admin Account

### Option 1: Via Supabase Dashboard (Recommended)

1. **Log in to Supabase Dashboard**
   - Go to your project at [supabase.com/dashboard](https://supabase.com/dashboard)

2. **Navigate to Authentication**
   - Click on **Authentication** in the left sidebar
   - Go to **Users**

3. **Create Admin User**
   - Click **Add User** button
   - Enter your admin email (e.g., `admin@bathalaenterprises.com`)
   - Enter a strong password (min 8 characters, mix of letters/numbers/symbols)
   - Click **Create User**

4. **Grant Admin Privileges**
   - Go to **SQL Editor** in the sidebar
   - Run this SQL command:

   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = jsonb_set(
     COALESCE(raw_user_meta_data, '{}'::jsonb),
     '{is_admin}',
     'true'
   )
   WHERE email = 'admin@bathalaenterprises.com';
   ```

5. **Verify Admin Status**
   - The user now has admin privileges
   - They can log in at `/admin/login`

### Option 2: Via Application (If Signup is Enabled)

If you've enabled signup in your Supabase project:

1. Go to `/admin/login` on your website
2. Sign up with your admin email
3. Run the SQL command from Step 4 above to grant admin privileges

---

## Logging In

1. **Navigate to Admin Login**
   - Go to `https://yourdomain.com/admin/login`
   - Or click "Admin Console" in the website footer

2. **Enter Credentials**
   - Email: Your admin email
   - Password: Your admin password

3. **Access Dashboard**
   - After successful login, you'll be redirected to `/admin/dashboard`
   - The session persists until you log out

4. **Logging Out**
   - Click the **Logout** button in the top-right corner
   - You'll be redirected to the login page

---

## Dashboard Overview

The admin dashboard has two main sections:

### Properties Tab
- View all listed properties
- Add new properties
- Edit existing properties
- Delete properties

### Services Tab
- View all services offered
- Add new services
- Edit existing services
- Delete services

---

## Managing Properties

### Adding a New Property

1. **Click "Add Property"**
   - Find the green "Add Property" button at the top

2. **Fill in Property Details**

   | Field | Description | Example |
   |-------|-------------|---------|
   | **Title** | Property name (required) | "Luxury 3BHK in Koramangala" |
   | **Location** | Address/Area (required) | "Koramangala 4th Block, Bangalore" |
   | **Type** | Rent/Lease/Sale | "Rent" |
   | **Price** | Amount in INR | 45000 (for ₹45,000) |
   | **Bedrooms** | Number of bedrooms | 3 |
   | **Square Feet** | Property size in sqft | 1800 |
   | **Description** | Detailed description | "Spacious apartment with..." |
   | **Image URL** | Property photo URL | See image guidelines below |

3. **Save Property**
   - Click **Save Property**
   - The property appears immediately on the website

### Image Guidelines

For property images, you can:

**Option A: Use Supabase Storage**
1. Go to **Storage** in Supabase Dashboard
2. Create a bucket named `property-images`
3. Upload your image
4. Copy the public URL
5. Paste in the Image URL field

**Option B: Use External URLs**
- Use high-quality images from stock sites
- Recommended size: 800x600px minimum
- Format: JPG or WebP for best performance

**Recommended Image Sources:**
- [Unsplash](https://unsplash.com) (free)
- [Pexels](https://pexels.com) (free)
- Your own professional photos

### Editing a Property

1. Find the property in the list
2. Click the **Edit** (pencil) icon
3. Modify the details
4. Click **Save Changes**

### Deleting a Property

1. Find the property in the list
2. Click the **Delete** (trash) icon
3. Confirm the deletion
4. The property is removed from the website

---

## Managing Services

### Adding a New Service

1. **Switch to Services Tab**
   - Click "Services" tab in the dashboard

2. **Click "Add Service"**

3. **Fill in Service Details**

   | Field | Description | Example |
   |-------|-------------|---------|
   | **Title** | Service name (required) | "Property Management" |
   | **Description** | What the service includes | "Complete management including..." |
   | **Price Range** | Pricing information | "₹500 - ₹2000/month" |
   | **Icon** | Icon name for display | "ShieldCheck" |

### Available Icons

Use one of these icon names for services:

| Icon Name | Best For |
|-----------|----------|
| `ShieldCheck` | Security, Protection |
| `Wrench` | Maintenance, Repairs |
| `Sparkles` | Premium, Cleaning |
| `BriefcaseBusiness` | Advisory, Consulting |

4. **Save Service**
   - Click **Save Service**
   - The service appears on the home page

### Editing a Service

1. Find the service in the list
2. Click the **Edit** icon
3. Update the information
4. Click **Save Changes**

### Deleting a Service

1. Find the service in the list
2. Click the **Delete** icon
3. Confirm the deletion

---

## Viewing Inquiries

Customer inquiries submitted through the contact form are stored in Supabase.

### Via Supabase Dashboard

1. Go to **Table Editor** in Supabase
2. Select the **inquiries** table
3. View all submitted inquiries

### Inquiry Status Workflow

| Status | Meaning |
|--------|---------|
| `new` | Fresh inquiry, not yet reviewed |
| `in-progress` | Being handled by team |
| `resolved` | Inquiry completed |

### Updating Inquiry Status

In Supabase Table Editor:
1. Find the inquiry
2. Click on the `status` field
3. Change to appropriate status
4. Press Enter to save

---

## Best Practices

### Property Listings

1. **Use High-Quality Images**
   - Professional photos increase engagement
   - Ensure good lighting and clear shots

2. **Write Compelling Descriptions**
   - Highlight key features
   - Mention nearby amenities
   - Include transportation links

3. **Keep Prices Updated**
   - Review and update prices monthly
   - Mark properties as unavailable when sold/rented

4. **SEO-Friendly Titles**
   - Include property type and location
   - Example: "Spacious 3BHK for Rent in Indiranagar"

### Service Descriptions

1. **Be Specific**
   - List exactly what's included
   - Mention response times

2. **Show Value**
   - Explain benefits to customers
   - Include any guarantees

3. **Clear Pricing**
   - Use ranges if prices vary
   - Explain pricing factors

### Security

1. **Strong Passwords**
   - Use 12+ characters
   - Mix uppercase, lowercase, numbers, symbols
   - Never share admin credentials

2. **Regular Audits**
   - Review admin users monthly
   - Remove access for former staff
   - Update passwords quarterly

3. **Session Management**
   - Always log out on shared computers
   - Don't save passwords in browsers

---

## Troubleshooting

### Can't Log In

1. **Check Credentials**
   - Ensure correct email format
   - Password is case-sensitive

2. **Reset Password**
   - Go to Supabase Dashboard → Authentication → Users
   - Find your user and click "Reset password"

3. **Verify Admin Status**
   - Run this SQL in Supabase:
   ```sql
   SELECT email, raw_user_meta_data 
   FROM auth.users 
   WHERE email = 'your-email@domain.com';
   ```
   - Check if `is_admin: true` is present

### Changes Not Appearing

1. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

2. **Wait for Revalidation**
   - The site caches for 60 seconds
   - Changes appear after the cache expires

3. **Check Supabase**
   - Verify data is saved in Table Editor
   - Look for any RLS policy issues

### Image Not Loading

1. **Check URL**
   - Ensure URL is publicly accessible
   - Test URL directly in browser

2. **CORS Issues**
   - Some image hosts block embedding
   - Use Supabase Storage or allowed hosts

3. **Image Format**
   - Use JPG, PNG, or WebP
   - Avoid unsupported formats

### Database Errors

1. **Check Connection**
   - Verify Supabase URL in environment variables
   - Ensure project is active (not paused)

2. **Check RLS Policies**
   - Ensure policies allow the operation
   - Test with RLS temporarily disabled

---

## Quick Reference

### Admin URLs

| Page | URL |
|------|-----|
| Login | `/admin/login` |
| Dashboard | `/admin/dashboard` |
| CMS | `/admin/cms` |

### Keyboard Shortcuts (Dashboard)

| Action | Shortcut |
|--------|----------|
| Save | Enter (in form) |
| Cancel | Escape |

### Support Contact

For technical support:
- Email: tech@bathalaenterprises.com
- Phone: +91 98765 43210

---

## Summary Checklist for New Admins

- [ ] Create admin account in Supabase
- [ ] Grant admin privileges with SQL
- [ ] Log in at `/admin/login`
- [ ] Add your first property
- [ ] Add your services
- [ ] Test on the live website
- [ ] Set up inquiry notifications

**You're all set to manage Bathala Enterprises! 🎉**
