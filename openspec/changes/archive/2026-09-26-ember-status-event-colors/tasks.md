## 1. Emit updates status

- [x] 1.1 After a successful `delegate`, set that Ember to `working` (same path as inbound)
- [x] 1.2 After a successful `answer`, set that Ember to `working`

## 2. Receive stays in sync

- [x] 2.1 Keep inbound `ack` working / `ask` / `finish` (idle or next queued) on the same status map
- [x] 2.2 On inbound `error` for a send with no other work, set that Ember to `idle`

## 3. Check (user runs the app)

- [x] 3.1 Sending work turns the dots yellow before `ack`
- [x] 3.2 An `ask` turns them blue; answering turns them yellow
- [x] 3.3 A rejected first `delegate` returns the dots to gray
