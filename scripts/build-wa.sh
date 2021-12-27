#!/usr/bin/bash

echo "Making sure WASM output directory exists ..."
mkdir -p ./root/aether/prod/
rm -fR ./root/aether/prod/wa 
mkdir ./root/aether/prod/wa || exit 1 

echo "Building WASM modules ..."
ls ./src/prod/wa/*.wat \
    | xargs -I {} basename {} ".wat" \
    | xargs -I {} wat2wasm --output=./root/aether/prod/wa/{}.wasm ./src/prod/wa/{}.wat || exit 1

echo "Success!"
