# nicopedia-dataset-parser

```sh
wget --content-disposition --continue --retry-connrefused --tries=0 --timeout=5 -r -np -l 1 -A zip -nd "http://dlsv.dsc.nii.ac.jp/idr/xxxxxxx@xxxxxx.com/xxxxxxxxxxxxxxxx/nicopedia/"
unzip head.zip
cargo run --release
npm i
node index.js > nicopedia.tsv
```