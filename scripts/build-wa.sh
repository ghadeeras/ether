#!/usr/bin/bash

echo "Making sure WASM output directory exists ..."
mkdir -p ./root/ether/prod/
rm -fR ./root/ether/prod/wa 
mkdir ./root/ether/prod/wa || exit 1 

echo "Building WASM modules ..."
ls ./src/prod/wa/*.wat \
    | xargs -I {} basename {} ".wat" \
    | xargs -I {} wat2wasm --output=./root/ether/prod/wa/{}.wasm ./src/prod/wa/{}.wat || exit 1

echo "Success!"
