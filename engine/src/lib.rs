mod logic;
mod types;

pub use logic::handle;
pub use logic::VERSION;
pub use types::*;

/// Run a JSON request and return a JSON response. Used by the CLI and tests.
pub fn run_json(input: &str) -> String {
    let req: Request = match serde_json::from_str(input) {
        Ok(req) => req,
        Err(err) => {
            return serde_json::to_string(&types::Response {
                ok: false,
                error: Some(format!("invalid json: {err}")),
                snapshot: None,
                play_from: -1,
                catalog: None,
            })
            .unwrap_or_else(|_| "{\"ok\":false}".into());
        }
    };
    serde_json::to_string(&handle(req)).unwrap_or_else(|_| "{\"ok\":false}".into())
}

fn pack(body: &[u8]) -> *mut u8 {
    let mut out = Vec::with_capacity(4 + body.len());
    out.extend_from_slice(&(body.len() as u32).to_le_bytes());
    out.extend_from_slice(body);
    let ptr = out.as_mut_ptr();
    std::mem::forget(out);
    ptr
}

#[no_mangle]
pub extern "C" fn alloc(len: u32) -> *mut u8 {
    let mut buf = vec![0u8; len as usize];
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, len: u32) {
    if ptr.is_null() || len == 0 {
        return;
    }
    unsafe {
        let _ = Vec::from_raw_parts(ptr, len as usize, len as usize);
    }
}

/// Pointer to a little-endian u32 length followed by UTF-8 JSON.
#[no_mangle]
pub extern "C" fn opencto_run(ptr: *const u8, len: u32) -> *mut u8 {
    if ptr.is_null() {
        return pack(br#"{"ok":false,"error":"null input","play_from":-1}"#);
    }
    let input = unsafe { std::slice::from_raw_parts(ptr, len as usize) };
    let text = String::from_utf8_lossy(input);
    let json = run_json(&text);
    pack(json.as_bytes())
}
