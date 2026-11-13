import Foundation

// Host <-> helper protocol: one JSON object per line.
//
//   host -> helper   {"id": 7, "cmd": "load", ...arguments}
//   helper -> host   {"reply": 7, "ok": true, ...result}
//                    {"reply": 7, "ok": false, "error": "message"}
//                    {"event": "state", ...fields}
//
// stdout carries protocol messages only. Diagnostics go to stderr, which the host
// forwards to its own console.

enum IPC {
    private static let lock = NSLock()

    static func send(_ message: [String: Any]) {
        guard JSONSerialization.isValidJSONObject(message),
              var data = try? JSONSerialization.data(withJSONObject: message) else {
            log("Dropping a message that can't be serialised: \(message)")
            return
        }

        data.append(0x0A)
        lock.lock()
        defer { lock.unlock() }
        FileHandle.standardOutput.write(data)
    }

    static func event(_ name: String, _ fields: [String: Any] = [:]) {
        var message = fields
        message["event"] = name
        send(message)
    }
}

func log(_ message: String) {
    FileHandle.standardError.write(Data("[FocalSonicHelper] \(message)\n".utf8))
}

struct HelperError: LocalizedError {
    let message: String
    init(_ message: String) { self.message = message }
    var errorDescription: String? { message }
}

/// A single decoded request from the host.
struct Command {
    let id: Int?
    let name: String
    private let arguments: [String: Any]

    init?(line: String) {
        guard let data = line.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let name = object["cmd"] as? String else {
            return nil
        }

        self.id = (object["id"] as? NSNumber)?.intValue
        self.name = name
        self.arguments = object
    }

    func string(_ key: String) -> String? { arguments[key] as? String }
    func number(_ key: String) -> Double? { (arguments[key] as? NSNumber)?.doubleValue }
    func bool(_ key: String) -> Bool? { (arguments[key] as? NSNumber)?.boolValue }
    func objects(_ key: String) -> [[String: Any]] { arguments[key] as? [[String: Any]] ?? [] }

    func requireString(_ key: String) throws -> String {
        guard let value = string(key), !value.isEmpty else { throw HelperError("'\(name)' needs a '\(key)'") }
        return value
    }

    func succeed(_ result: [String: Any] = [:]) {
        var message = result
        message["ok"] = true
        if let id { message["reply"] = id }
        IPC.send(message)
    }

    func fail(_ error: Error) {
        var message: [String: Any] = ["ok": false, "error": error.localizedDescription]
        if let id { message["reply"] = id }
        IPC.send(message)
    }
}
