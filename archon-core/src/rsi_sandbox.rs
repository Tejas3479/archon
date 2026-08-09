use wasmi::{Engine, Linker, Module, Store, Config};
use crate::error::ArchonError;

pub struct Sandbox {
    engine: Engine,
}

impl Sandbox {
    // WHY: Configures the wasmi engine with fuel-metering to limit instruction execution bounds
    pub fn new() -> Self {
        let mut config = Config::default();
        config.consume_fuel(true);
        let engine = Engine::new(&config);
        Self { engine }
    }

    // WHY: Executes sandboxed compiled WebAssembly code in isolated virtual memory with fuel constraints
    pub fn run(&self, wasm_bytes: &[u8], _input_json: &str) -> Result<String, ArchonError> {
        let module = Module::new(&self.engine, wasm_bytes)
            .map_err(|e| ArchonError::Sandbox(format!("Failed to load WASM module: {:?}", e)))?;

        // 1. Enforce memory limits (100MB = 1600 Wasm pages of 64KB)
        for export in module.exports() {
            if let wasmi::ExternType::Memory(mem_type) = export.ty() {
                let initial_pages = mem_type.initial_pages();
                let initial_pages_u32 = u32::from(initial_pages);
                if initial_pages_u32 > 1600 {
                    return Err(ArchonError::Sandbox(format!(
                        "Resource limit exceeded: Initial memory page request '{}' exceeds 100MB limit",
                        initial_pages_u32
                    )));
                }
            }
        }

        // 2. Initialize Store with 10M fuel limit (corresponds to instruction iterations)
        let mut store = Store::new(&self.engine, ());
        store.set_fuel(10_000_000)
            .map_err(|e| ArchonError::Sandbox(format!("Failed to initialize fuel limit: {:?}", e)))?;

        // 3. Linker setup - empty linker ensures zero networking/filesystem imports are available
        let linker = Linker::<()>::new(&self.engine);

        let instance = linker.instantiate(&mut store, &module)
            .map_err(|e| ArchonError::Sandbox(format!("Failed to instantiate module: {:?}", e)))?
            .start(&mut store)
            .map_err(|e| ArchonError::Sandbox(format!("Module start execution failed: {:?}", e)))?;

        // 4. Retrieve and execute exported run function
        let run_func = instance.get_typed_func::<(), i32>(&store, "run")
            .map_err(|e| ArchonError::Sandbox(format!("Exported 'run' function signature not found: {:?}", e)))?;

        let result = run_func.call(&mut store, ())
            .map_err(|e| ArchonError::Sandbox(format!("Sandbox execution failed or ran out of fuel: {:?}", e)))?;

        let remaining_fuel = store.get_fuel().unwrap_or(0);
        let fuel_consumed = 10_000_000 - remaining_fuel;

        Ok(format!("{{ \"status\": \"success\", \"result\": {}, \"fuel_consumed\": {} }}", result, fuel_consumed))
    }
}
