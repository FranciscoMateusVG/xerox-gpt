compile-mac:
  @echo "Running bun compiler for mac..."
  bun build --compile --target=bun-darwin-arm64 ./src/index.ts --outfile myapp

compile-linux:
  @echo "Running bun compiler for linux..."
  bun build --compile --target=bun-linux-x64 ./src/index.ts --outfile myapp

inject:
  @echo "Injecting sea-config.json..."
  cp $(volta which node) hello
  npx postject hello NODE_SEA_BLOB sea-prep.blob \
    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 \
    --macho-segment-name NODE_SEA 

run:
  @echo "Running commitgpt..."
  bun src/index.ts

delete-binary:
  @echo "Deleting binary..."
  rm -f /usr/local/bin/commit

move-binary:
  @echo "Installing binary..."
  sudo mv commit /usr/local/bin/ 
  chmod +x /usr/local/bin/commit