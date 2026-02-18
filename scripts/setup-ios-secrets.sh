#!/bin/bash

# Load the iOS Client ID from .env.local
if [ -f .env.local ]; then
  # Try iOS specific ID first, then fall back to generic ID
  IOS_ID=$(grep NEXT_PUBLIC_IOS_GOOGLE_CLIENT_ID .env.local | cut -d '=' -f2)
  if [ -z "$IOS_ID" ] || [[ "$IOS_ID" == *"YOUR_IOS_CLIENT_ID_HERE"* ]]; then
    IOS_ID=$(grep NEXT_PUBLIC_GOOGLE_CLIENT_ID .env.local | cut -d '=' -f2)
  fi

  # Generate the Reverse Client ID
  # Example: 12345.apps.googleusercontent.com -> com.googleusercontent.apps.12345
  CLEAN_ID=$(echo $IOS_ID | cut -d '.' -f1)
  REVERSE_ID="com.googleusercontent.apps.$CLEAN_ID"

  echo "🔐 Injecting Google Reverse Client ID into Info.plist..."
  
  # Use PlistBuddy (standard on macOS) to update the scheme
  PLIST="ios/App/App/Info.plist"
  /usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:0:CFBundleURLSchemes:0 $REVERSE_ID" "$PLIST"
  
  echo "✅ Done! Info.plist updated with $REVERSE_ID"
else
  echo "❌ Error: .env.local file not found."
  exit 1
fi
