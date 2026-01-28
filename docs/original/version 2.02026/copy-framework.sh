#!/bin/bash

# SJ Dashboard Framework - Quick Start Copy Script
# This script automates copying framework files to a new project

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

# Banner
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   SJ Dashboard Framework - Quick Start Copy Script       ║"
echo "║   Version 1.0 (Option B + Meetings)                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if destination directory is provided
if [ -z "$1" ]; then
    print_error "Usage: ./copy-framework.sh <destination-directory>"
    echo ""
    echo "Example:"
    echo "  ./copy-framework.sh ../my-new-app"
    echo ""
    exit 1
fi

DEST_DIR="$1"
SOURCE_DIR="$(pwd)"

# Confirm with user
print_warning "This will copy framework files to: $DEST_DIR"
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Cancelled."
    exit 0
fi

# Create destination directory if it doesn't exist
if [ ! -d "$DEST_DIR" ]; then
    mkdir -p "$DEST_DIR"
    print_success "Created directory: $DEST_DIR"
fi

cd "$DEST_DIR"
DEST_DIR="$(pwd)"  # Get absolute path
cd "$SOURCE_DIR"

print_info "Copying from: $SOURCE_DIR"
print_info "Copying to: $DEST_DIR"
echo ""

# Step 1: Copy root configuration files
print_info "Step 1/10: Copying root configuration files..."
cp package.json "$DEST_DIR/" 2>/dev/null || print_warning "package.json not found"
cp package-lock.json "$DEST_DIR/" 2>/dev/null || print_warning "package-lock.json not found"
cp vite.config.ts "$DEST_DIR/" 2>/dev/null || print_warning "vite.config.ts not found"
cp tailwind.config.ts "$DEST_DIR/" 2>/dev/null || print_warning "tailwind.config.ts not found"
cp tsconfig.json "$DEST_DIR/" 2>/dev/null || print_warning "tsconfig.json not found"
cp tsconfig.app.json "$DEST_DIR/" 2>/dev/null || print_warning "tsconfig.app.json not found"
cp tsconfig.node.json "$DEST_DIR/" 2>/dev/null || print_warning "tsconfig.node.json not found"
cp eslint.config.js "$DEST_DIR/" 2>/dev/null || print_warning "eslint.config.js not found"
cp postcss.config.js "$DEST_DIR/" 2>/dev/null || print_warning "postcss.config.js not found"
cp components.json "$DEST_DIR/" 2>/dev/null || print_warning "components.json not found"
cp index.html "$DEST_DIR/" 2>/dev/null || print_warning "index.html not found"
cp .env.example "$DEST_DIR/" 2>/dev/null || print_warning ".env.example not found"
cp .gitignore "$DEST_DIR/" 2>/dev/null || print_warning ".gitignore not found"
print_success "Root config files copied"

# Step 2: Copy public folder
print_info "Step 2/10: Copying public assets..."
if [ -d "public" ]; then
    cp -r public "$DEST_DIR/"
    print_success "Public folder copied"
else
    print_warning "public/ folder not found"
fi

# Step 3: Copy source entry points
print_info "Step 3/10: Copying source entry points..."
mkdir -p "$DEST_DIR/src"
cp src/main.tsx "$DEST_DIR/src/" 2>/dev/null || print_warning "src/main.tsx not found"
cp src/App.tsx "$DEST_DIR/src/" 2>/dev/null || print_warning "src/App.tsx not found"
cp src/index.css "$DEST_DIR/src/" 2>/dev/null || print_warning "src/index.css not found"
cp src/vite-env.d.ts "$DEST_DIR/src/" 2>/dev/null || print_warning "src/vite-env.d.ts not found"
print_success "Entry points copied"

# Step 4: Copy configuration & constants
print_info "Step 4/10: Copying config & constants..."
if [ -d "src/config" ]; then
    cp -r src/config "$DEST_DIR/src/"
    print_success "Config folder copied"
fi
if [ -d "src/constants" ]; then
    cp -r src/constants "$DEST_DIR/src/"
    print_success "Constants folder copied"
fi

# Step 5: Copy types
print_info "Step 5/10: Copying TypeScript types..."
if [ -d "src/types" ]; then
    cp -r src/types "$DEST_DIR/src/"
    print_success "Types folder copied"
fi

# Step 6: Copy contexts & integrations
print_info "Step 6/10: Copying contexts & integrations..."
if [ -d "src/contexts" ]; then
    cp -r src/contexts "$DEST_DIR/src/"
    print_success "Contexts folder copied"
fi
if [ -d "src/integrations" ]; then
    cp -r src/integrations "$DEST_DIR/src/"
    print_success "Integrations folder copied"
fi

# Step 7: Copy lib (utilities)
print_info "Step 7/10: Copying utilities & helpers..."
if [ -d "src/lib" ]; then
    cp -r src/lib "$DEST_DIR/src/"
    print_success "Lib folder copied"
fi
if [ -d "src/utils" ]; then
    cp -r src/utils "$DEST_DIR/src/"
    print_success "Utils folder copied"
fi
if [ -d "src/assets" ]; then
    cp -r src/assets "$DEST_DIR/src/"
    print_success "Assets folder copied"
fi

# Step 8: Copy all components
print_info "Step 8/10: Copying components..."
if [ -d "src/components" ]; then
    mkdir -p "$DEST_DIR/src/components"

    # Copy UI components (shadcn)
    if [ -d "src/components/ui" ]; then
        cp -r src/components/ui "$DEST_DIR/src/components/"
        print_success "  ✓ UI components (shadcn/ui)"
    fi

    # Copy common components
    if [ -d "src/components/common" ]; then
        cp -r src/components/common "$DEST_DIR/src/components/"
        print_success "  ✓ Common components"
    fi

    # Copy layout components
    if [ -d "src/components/layout" ]; then
        cp -r src/components/layout "$DEST_DIR/src/components/"
        print_success "  ✓ Layout components"
    fi

    # Copy auth components
    if [ -d "src/components/auth" ]; then
        cp -r src/components/auth "$DEST_DIR/src/components/"
        print_success "  ✓ Auth components"
    fi

    # Copy feature components (V1 only)
    if [ -d "src/components/admin" ]; then
        cp -r src/components/admin "$DEST_DIR/src/components/"
        print_success "  ✓ Admin components"
    fi
    if [ -d "src/components/clients" ]; then
        cp -r src/components/clients "$DEST_DIR/src/components/"
        print_success "  ✓ Clients components"
    fi
    if [ -d "src/components/meetings" ]; then
        cp -r src/components/meetings "$DEST_DIR/src/components/"
        print_success "  ✓ Meetings components"
    fi
    if [ -d "src/components/knowledge" ]; then
        cp -r src/components/knowledge "$DEST_DIR/src/components/"
        print_success "  ✓ Knowledge Base components"
    fi
    if [ -d "src/components/ai" ]; then
        cp -r src/components/ai "$DEST_DIR/src/components/"
        print_success "  ✓ AI components"
    fi
    if [ -d "src/components/feedback" ]; then
        cp -r src/components/feedback "$DEST_DIR/src/components/"
        print_success "  ✓ Feedback components"
    fi
    if [ -d "src/components/notifications" ]; then
        cp -r src/components/notifications "$DEST_DIR/src/components/"
        print_success "  ✓ Notification components"
    fi
fi

# Step 9: Copy pages (V1 only)
print_info "Step 9/10: Copying pages..."
if [ -d "src/pages" ]; then
    mkdir -p "$DEST_DIR/src/pages"

    # Copy core pages
    cp src/pages/Dashboard.tsx "$DEST_DIR/src/pages/" 2>/dev/null && print_success "  ✓ Dashboard page"
    cp src/pages/Profile.tsx "$DEST_DIR/src/pages/" 2>/dev/null && print_success "  ✓ Profile page"
    cp src/pages/Settings.tsx "$DEST_DIR/src/pages/" 2>/dev/null && print_success "  ✓ Settings page"
    cp src/pages/Clients.tsx "$DEST_DIR/src/pages/" 2>/dev/null && print_success "  ✓ Clients page"
    cp src/pages/Feedback.tsx "$DEST_DIR/src/pages/" 2>/dev/null && print_success "  ✓ Feedback page"

    # Copy feature page folders
    if [ -d "src/pages/admin" ]; then
        cp -r src/pages/admin "$DEST_DIR/src/pages/"
        print_success "  ✓ Admin pages"
    fi
    if [ -d "src/pages/meetings" ]; then
        cp -r src/pages/meetings "$DEST_DIR/src/pages/"
        print_success "  ✓ Meetings pages"
    fi
    if [ -d "src/pages/knowledge" ]; then
        cp -r src/pages/knowledge "$DEST_DIR/src/pages/"
        print_success "  ✓ Knowledge Base pages"
    fi
    if [ -d "src/pages/ai" ]; then
        cp -r src/pages/ai "$DEST_DIR/src/pages/"
        print_success "  ✓ AI pages"
    fi
fi

# Step 10: Copy hooks
print_info "Step 10/10: Copying hooks..."
if [ -d "src/hooks" ]; then
    cp -r src/hooks "$DEST_DIR/src/"
    print_success "Hooks folder copied (will need cleanup)"
fi

# Copy Supabase folder
print_info "Copying Supabase configuration..."
if [ -d "supabase" ]; then
    cp -r supabase "$DEST_DIR/"
    print_success "Supabase folder copied"
fi

# Copy framework documentation
print_info "Copying framework documentation..."
cp SJ-DASHBOARD-FRAMEWORK_EXTRACTION_GUIDE.md "$DEST_DIR/" 2>/dev/null || print_warning "Extraction guide not found"
cp SJ-DASHBOARD-FRAMEWORK_SETUP.md "$DEST_DIR/" 2>/dev/null || print_warning "Setup guide not found"
cp SJ-DASHBOARD-FRAMEWORK_CLEANUP_CHECKLIST.md "$DEST_DIR/" 2>/dev/null || print_warning "Cleanup checklist not found"
print_success "Documentation copied"

# Create .env file from example
print_info "Creating .env file..."
if [ -f "$DEST_DIR/.env.example" ]; then
    cp "$DEST_DIR/.env.example" "$DEST_DIR/.env"
    print_success ".env file created from .env.example"
    print_warning "Remember to update .env with your credentials!"
fi

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                   COPY COMPLETE! ✓                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
print_success "Framework files copied to: $DEST_DIR"
echo ""
print_info "NEXT STEPS:"
echo ""
echo "1. Navigate to your new project:"
echo "   cd $DEST_DIR"
echo ""
echo "2. Follow the setup guide:"
echo "   cat SJ-DASHBOARD-FRAMEWORK_SETUP.md"
echo ""
echo "3. Install dependencies:"
echo "   npm install"
echo ""
echo "4. Update .env with your credentials"
echo ""
echo "5. Follow cleanup checklist:"
echo "   cat SJ-DASHBOARD-FRAMEWORK_CLEANUP_CHECKLIST.md"
echo ""
print_warning "IMPORTANT: Review and clean up copied files before deploying!"
print_warning "Some features/hooks need to be removed (see cleanup checklist)"
echo ""
