extern crate csv;
extern crate fnv;
extern crate zip;

use std::fs;
use std::error::Error;
use std::process;
use fnv::FnvHashMap;

fn main() {
	if let Err(err) = run() {
		println!("{}", err);
		process::exit(1);
	}
}

fn run() -> Result<(), Box<Error>> {
	let mut map = FnvHashMap::default();
	let mut cnt = 0;

	for filename in &[
		"rev2008.zip",
		"rev2009.zip",
		"rev2010.zip",
		"rev2011.zip",
		"rev2012.zip",
		"rev2013.zip",
		"rev2014.zip",
	] {
		println!("deflating {:?}", filename);

		let zip_file = fs::File::open(filename)?;
		let mut archive = zip::ZipArchive::new(zip_file)?;

		for i in 0..archive.len() {
			let file = archive.by_index(i)?;
			println!("parsing {:?}", file.sanitized_name());

			let mut rdr = csv::ReaderBuilder::new()
				.has_headers(false)
				.double_quote(false)
				.escape(Some(b'\\'))
				.from_reader(file);

			for result in rdr.deserialize() {
				cnt += 1;
				let record: (i32, String, String) = result?;
				map.insert(record.0, record);
				if cnt % 10000 == 0 {
					println!("{} records parsed (unique: {})", cnt, map.len());
				}
			}
		}
	}

	let mut wtr = csv::Writer::from_path("latest.csv")?;

	for (_key, val) in map.iter() {
		wtr.write_record(&[&val.0.to_string(), &val.1, &val.2])?;
	}

	wtr.flush()?;
	Ok(())
}
