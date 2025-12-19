#!/bin/bash

# Convert .jsx to .tsx
find app src -name "*.jsx" -type f | while read file; do
  tsx_file="${file%.jsx}.tsx"
  echo "Converting $file to $tsx_file"
  mv "$file" "$tsx_file"
done

# Convert .js to .ts (excluding config files)
find app src -name "*.js" -type f ! -name "*.config.js" | while read file; do
  ts_file="${file%.js}.ts"
  echo "Converting $file to $ts_file"
  mv "$file" "$ts_file"
done

echo "Conversion complete!"

