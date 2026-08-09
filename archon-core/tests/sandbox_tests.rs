use std::process::Command;
use std::fs;
use std::path::Path;
use archon_core::rsi_sandbox::Sandbox;

fn compile_wasm(source_code: &str, output_path: &Path, extra_args: &[&str]) {
    let temp_src = output_path.with_extension("rs");
    fs::write(&temp_src, source_code).unwrap();
    
    let mut cmd = Command::new("rustc");
    cmd.args(&[
        "--target", "wasm32-unknown-unknown",
        "--crate-type", "cdylib",
        "-o", output_path.to_str().unwrap(),
    ]);
    cmd.args(extra_args);
    cmd.arg(temp_src.to_str().unwrap());
    
    // Inherit the process path so rustc is resolved on Windows
    if let Ok(path) = std::env::var("PATH") {
        cmd.env("PATH", path);
    }
    
    let status = cmd.status().expect("failed to run rustc");
    assert!(status.success(), "Wasm compilation failed");
    
    let _ = fs::remove_file(temp_src);
}

#[test]
fn test_sandbox_safe_execution() {
    let out_dir = Path::new("target").join("test_output");
    fs::create_dir_all(&out_dir).unwrap();
    let wasm_file = out_dir.join("safe_test.wasm");
    
    let source = r#"
        #[no_mangle]
        pub extern "C" fn run() -> i32 {
            42 + 8
        }
    "#;
    
    compile_wasm(source, &wasm_file, &[]);
    
    let wasm_bytes = fs::read(&wasm_file).unwrap();
    let sandbox = Sandbox::new();
    let result_str = sandbox.run(&wasm_bytes, "{}").expect("Should run successfully");
    
    assert!(result_str.contains("\"status\": \"success\""));
    assert!(result_str.contains("\"result\": 50"));
    
    let _ = fs::remove_file(wasm_file);
}

#[test]
fn test_sandbox_fuel_exhaustion() {
    let out_dir = Path::new("target").join("test_output");
    fs::create_dir_all(&out_dir).unwrap();
    let wasm_file = out_dir.join("infinite_loop.wasm");
    
    let source = r#"
        #[no_mangle]
        pub extern "C" fn run() -> i32 {
            let mut sum = 0;
            loop {
                sum += 1;
                // prevent optimizer from removing loop
                unsafe { std::ptr::read_volatile(&sum); }
            }
        }
    "#;
    
    compile_wasm(source, &wasm_file, &[]);
    
    let wasm_bytes = fs::read(&wasm_file).unwrap();
    let sandbox = Sandbox::new();
    let err = sandbox.run(&wasm_bytes, "{}");
    
    assert!(err.is_err());
    let err_msg = format!("{:?}", err.unwrap_err());
    assert!(err_msg.contains("ran out of fuel") || err_msg.contains("Trap"));
    
    let _ = fs::remove_file(wasm_file);
}

#[test]
fn test_sandbox_memory_limit_exceeded() {
    let out_dir = Path::new("target").join("test_output");
    fs::create_dir_all(&out_dir).unwrap();
    let wasm_file = out_dir.join("large_memory.wasm");
    
    let source = r#"
        #[no_mangle]
        pub extern "C" fn run() -> i32 {
            0
        }
    "#;
    
    // Request 1610 Wasm pages (105.5 MB) via linker arg (which exceeds 1600 limit)
    compile_wasm(source, &wasm_file, &["-C", "link-arg=--initial-memory=105512960"]);
    
    let wasm_bytes = fs::read(&wasm_file).unwrap();
    let sandbox = Sandbox::new();
    let err = sandbox.run(&wasm_bytes, "{}");
    
    assert!(err.is_err());
    let err_msg = format!("{:?}", err.unwrap_err());
    assert!(err_msg.contains("Initial memory page request") || err_msg.contains("limit exceeded"));
    
    let _ = fs::remove_file(wasm_file);
}
