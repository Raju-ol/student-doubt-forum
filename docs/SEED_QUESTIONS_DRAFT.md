# Seed questions — draft for human review

30 practical questions to give the community feed real content before inviting more students. **Nothing here has been posted.** Every item is a draft for you to edit, personalise and post yourself.

## How to use this (read first)

- **Only post a question you would genuinely ask.** Delete any you don't relate to and swap in real ones from your own syllabus, labs and exams. Real questions with real context ("here is my code, here is the error") beat polished ones.
- **Use real accounts.** Ask 4–6 classmates to each post a few from their own accounts. Posting 30 from one admin account looks empty and trips the per-account posting limit.
- **Spread them out.** About 3–4 per day over a week or two, so "Latest questions" always looks alive.
- **Verify every answer** against your notes or by running the code before posting. I wrote them carefully, but you are the one putting your name on them.
- **Part A (20 items) has drafted answers.** Post the answer from a *different* classmate's account, then have the asker accept it, the same way real use would go.
- **Part B (10 items) has no answer on purpose.** They fill the "No accepted answer" list and the "be someone's hero" card, and give other students a reason to answer.
- Subjects match the live catalogue. For C or C++ questions, use "Other" until a subject is added at `/admin/catalog`.
- Tags: lowercase, up to 5, no leading `#`. Pick the academic level when you post.

---

# Part A — With a drafted answer (20)

## A1 · Data Structures

**Title:** My recursive DFS crashes with a stack overflow on a graph with 100000 nodes

**Tags:** dfs, recursion, graphs, java

**Question:**
I wrote a recursive DFS in Java for a graph given as an adjacency list. It works for small test graphs but throws `StackOverflowError` when the graph is one long chain of 100000 nodes.

```java
void dfs(int node) {
    visited[node] = true;
    for (int next : graph.get(node)) {
        if (!visited[next]) dfs(next);
    }
}
```

Is my logic wrong, or is this a limit of recursion? How do I fix it without changing what the algorithm does?

**Answer:**
Your logic is correct. The problem is depth: each recursive call adds a stack frame, and Java's default stack holds roughly 10–20 thousand frames, so a 100000-long chain overflows it.

Replace the call stack with your own stack on the heap:

```java
void dfs(int start, List<List<Integer>> graph) {
    boolean[] seen = new boolean[graph.size()];
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(start);
    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (seen[node]) continue;
        seen[node] = true;
        for (int next : graph.get(node)) {
            if (!seen[next]) stack.push(next);
        }
    }
}
```

Two notes: it visits neighbours in reverse order compared to the recursive version (push them in reverse if the order matters), and it is still O(V + E). Running the recursive version in a `Thread` with a larger stack size also works, but the explicit stack is the safer habit.

## A2 · Data Structures

**Title:** HashMap or TreeMap for storing student roll numbers and marks?

**Tags:** hashmap, treemap, java, collections

**Question:**
For a mini project I need to store roll number → marks for about 500 students. I need fast lookup by roll number, but I also want to print students in roll-number order and find everyone between roll 100 and 200.

I know both are "maps" but I can't decide. What actually differs, and which should I pick here?

**Answer:**
Pick `TreeMap` for this case.

- **`HashMap`**: average O(1) get/put, but the iteration order is arbitrary and it has no idea about ranges.
- **`TreeMap`**: keeps keys sorted (a red-black tree), so get/put are O(log n), iteration is in key order, and it has range operations.

You need sorted printing and the 100–200 range, which `TreeMap` gives directly:

```java
TreeMap<Integer, Integer> marks = new TreeMap<>();
// ... put(roll, mark) ...
for (var e : marks.entrySet()) { /* already in roll order */ }
Map<Integer, Integer> range = marks.subMap(100, true, 200, true);
```

With only 500 entries the O(log n) cost is invisible. Use `HashMap` when you only ever look up by key and order does not matter. If you want insertion order, that is `LinkedHashMap`.

## A3 · Data Structures

**Title:** Why does my binary search loop forever when the array has 2 elements?

**Tags:** binary-search, loops, debugging, java

**Question:**
This binary search never ends for `int[] a = {5, 9}` when searching for 9:

```java
int low = 0, high = a.length - 1;
while (low < high) {
    int mid = (low + high) / 2;
    if (a[mid] < x) low = mid;
    else high = mid;
}
```

It works on bigger arrays most of the time. What is wrong?

**Answer:**
`low = mid` can fail to make progress. With `low = 0`, `high = 1`, `mid = (0 + 1) / 2 = 0`. Since `a[0] = 5 < 9`, you set `low = 0` again, so the range never shrinks.

Whenever you have already tested `a[mid]` and rejected it, move past it:

```java
int low = 0, high = a.length - 1;
while (low <= high) {
    int mid = low + (high - low) / 2;   // avoids int overflow
    if (a[mid] == x) return mid;
    if (a[mid] < x) low = mid + 1;
    else high = mid - 1;
}
return -1;
```

Rule of thumb: every iteration must strictly shrink `[low, high]`. Also use `low + (high - low) / 2`, because `(low + high)` can overflow for very large arrays.

## A4 · Data Structures

**Title:** How do I convert an infix expression to postfix by hand for the exam?

**Tags:** stack, postfix, expression, exam

**Question:**
We get questions like "convert `a + b * c - d / e` to postfix using a stack". I understand what postfix is, but I get the order of operators on the stack wrong. Is there a reliable step-by-step method?

**Answer:**
Use the stack algorithm (shunting-yard):

1. Operand (a letter or number) → write it straight to the output.
2. Operator → while the stack top has **higher or equal** precedence (left-associative operators), pop it to the output; then push the new operator.
3. `(` → push. `)` → pop to output until `(`, then discard both.
4. At the end, pop everything left on the stack to the output.

Precedence: `^` highest (right-associative), then `* /`, then `+ -`.

For `a + b * c - d / e`:

| Read | Stack | Output |
|---|---|---|
| a | | a |
| + | + | a |
| b | + | a b |
| * | + * | a b |
| c | + * | a b c |
| - | - (pops `*` then `+`) | a b c * + |
| d | - | a b c * + d |
| / | - / | a b c * + d |
| e | - / | a b c * + d e |
| end | | a b c * + d e / - |

Answer: `abc*+de/-`. Check by reading it back: `b*c` first, add `a`, then `d/e`, then subtract.

## A5 · DBMS

**Title:** Super key, candidate key, primary key, alternate key: how do I tell them apart?

**Tags:** keys, normalization, exam, dbms

**Question:**
I keep mixing these four up in exam answers. For a table `Student(RollNo, Email, Name, Phone)` where roll number and email are both unique, which attribute sets are which?

**Answer:**
Think of them as nested:

- **Super key**: any set of attributes that uniquely identifies a row. Extra attributes are allowed, e.g. `{RollNo}`, `{RollNo, Name}`, `{Email, Phone}`.
- **Candidate key**: a *minimal* super key (remove any attribute and it stops being unique). Here: `{RollNo}` and `{Email}`.
- **Primary key**: the one candidate key you choose to identify rows (not null). Say `RollNo`.
- **Alternate key**: the candidate keys you did **not** choose. Here `Email`.

So: every candidate key is a super key, but not every super key is a candidate key (`{RollNo, Name}` is not minimal). Exam tip: always write one example of each from the table in the question.

## A6 · DBMS

**Title:** How do I find the second highest salary without using LIMIT or OFFSET?

**Tags:** sql, subquery, interview, dbms

**Question:**
I have `employee(id, name, salary)` and need the second highest salary. Every answer I find online uses `LIMIT 1 OFFSET 1`, but our lab uses a system where that isn't available. What are other ways, and what happens if two people share the top salary?

**Answer:**
Two portable ways.

**1. Subquery on the maximum:**
```sql
SELECT MAX(salary) AS second_highest
FROM employee
WHERE salary < (SELECT MAX(salary) FROM employee);
```
"Highest salary strictly below the top salary". If two people share the top salary they are both excluded, so you still get the next *distinct* value. If there is no second distinct salary, the result is `NULL`.

**2. Window function (if supported):**
```sql
SELECT DISTINCT salary FROM (
  SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
  FROM employee
) t
WHERE rnk = 2;
```
`DENSE_RANK` gives tied salaries the same rank without skipping numbers, which is what "second highest" usually means. `RANK` would skip rank 2 after a tie, which is why it is the wrong choice here.

## A7 · DBMS

**Title:** How do I check whether a decomposition is lossless-join in an exam question?

**Tags:** normalization, decomposition, functional-dependency, exam

**Question:**
Given `R(A, B, C)` with functional dependency `B → C`, decomposed into `R1(A, B)` and `R2(B, C)`. The question asks if this decomposition is lossless. I know the definition, but how do I actually check it quickly?

**Answer:**
For a decomposition into two relations, use the **binary test**: it is lossless if the common attributes functionally determine all of one side, i.e.

- `(R1 ∩ R2) → R1`, or
- `(R1 ∩ R2) → R2` (using the given FDs).

Here `R1 ∩ R2 = {B}`. Does `B` determine all of `R2 = {B, C}`? Yes, because `B → C` is given. So the condition holds and the decomposition is **lossless**.

Intuition: joining `R1` and `R2` on `B` can only match each `B` value to one `C` value, so the join cannot invent extra (spurious) rows. If the common attribute were not a key of either side (say `B` determined nothing), the join could multiply rows and the decomposition would be lossy.

## A8 · DBMS

**Title:** "Cannot add or update a child row: a foreign key constraint fails" when inserting data

**Tags:** mysql, foreign-key, sql, error

**Question:**
I created `department(dept_id, name)` and `student(roll, name, dept_id)` with `dept_id` as a foreign key. Inserting into `student` gives:

`ERROR 1452: Cannot add or update a child row: a foreign key constraint fails`

My insert looks fine to me:
```sql
INSERT INTO student VALUES (1, 'Riya', 3);
```
What is the constraint actually complaining about?

**Answer:**
The foreign key says every `dept_id` in `student` must already exist in `department`. The error means the parent row with `dept_id = 3` does not exist yet.

Checklist, in order:

1. Insert parents first:
```sql
INSERT INTO department VALUES (3, 'CSE');
INSERT INTO student VALUES (1, 'Riya', 3);
```
2. Check the value exists: `SELECT * FROM department WHERE dept_id = 3;`
3. Check both columns have the **same type** (e.g. `INT` vs `INT UNSIGNED` also fails).
4. When loading a dump with many tables, load parents before children.

Never disable the check (`SET FOREIGN_KEY_CHECKS=0`) just to make the error go away. It hides bad data and the problem returns later.

## A9 · Java

**Title:** Printing my object shows "Student@15db9742" instead of the data

**Tags:** java, tostring, oop, beginner

**Question:**
```java
Student s = new Student("Riya", 21);
System.out.println(s);
```
prints `Student@15db9742`. I expected the name and roll number. Where does that text come from and how do I change it?

**Answer:**
`println(s)` calls `s.toString()`. If your class does not define it, Java uses `Object.toString()`, which prints the class name plus `@` plus the object's hash code in hex. That is the text you saw.

Override it:

```java
@Override
public String toString() {
    return "Student{name=" + name + ", roll=" + roll + "}";
}
```

Now `System.out.println(s)` prints `Student{name=Riya, roll=21}`. Keep `@Override`: if you misspell the method name, the compiler will tell you instead of silently doing nothing. The same method is what makes lists print readably, e.g. `[Student{...}, Student{...}]`.

## A10 · Java

**Title:** Scanner nextLine() is skipped after nextInt(), why?

**Tags:** java, scanner, input, beginner

**Question:**
```java
Scanner sc = new Scanner(System.in);
int age = sc.nextInt();
String name = sc.nextLine();
```
When I type `21` and Enter, the program ends without letting me type the name, and `name` is empty. What is happening?

**Answer:**
`nextInt()` reads only the number `21`, and leaves the **Enter (newline)** you pressed in the input buffer. The next `nextLine()` immediately reads the rest of that line, which is empty, so it returns `""` without waiting for you.

Fixes:

1. Consume the leftover newline:
```java
int age = sc.nextInt();
sc.nextLine();                 // throws away the rest of the line
String name = sc.nextLine();
```
2. Or read every line as text and parse:
```java
int age = Integer.parseInt(sc.nextLine().trim());
String name = sc.nextLine();
```
Option 2 avoids this whole class of bug, and it also lets you handle bad input with a `try/catch` around `parseInt`.

## A11 · Java

**Title:** ConcurrentModificationException when removing items from an ArrayList in a for-each loop

**Tags:** java, arraylist, exception, iterator

**Question:**
I want to remove all students with marks below 40:

```java
for (Student s : students) {
    if (s.getMarks() < 40) students.remove(s);
}
```
It sometimes throws `ConcurrentModificationException`. Why "sometimes", and what is the right way to do this?

**Answer:**
The for-each loop uses an iterator behind the scenes. If you change the list directly while the iterator is walking it, the iterator notices the list was modified and throws. It is "sometimes" because removing the second-to-last element happens to end the loop before the check runs, so you can get away with it by accident.

Safe options:

```java
// 1. Simplest (Java 8+)
students.removeIf(s -> s.getMarks() < 40);

// 2. Explicit iterator
Iterator<Student> it = students.iterator();
while (it.hasNext()) {
    if (it.next().getMarks() < 40) it.remove();   // remove via the iterator
}
```

Use `removeIf` when you can. If you need to remove inside a normal indexed loop, iterate backwards so indexes don't shift.

## A12 · Operating Systems

**Title:** How do I compute average waiting time for FCFS vs non-preemptive SJF?

**Tags:** scheduling, fcfs, sjf, exam

**Question:**
Processes (arrival, burst): P1 (0, 6), P2 (1, 8), P3 (2, 2), P4 (3, 3). I need the average waiting time under FCFS and under non-preemptive SJF. I always get the SJF order wrong because new processes keep arriving.

**Answer:**
Waiting time = start time − arrival time (for non-preemptive).

**FCFS** (run in arrival order): P1 0–6, P2 6–14, P3 14–16, P4 16–19.
Waiting: P1 = 0, P2 = 6−1 = 5, P3 = 14−2 = 12, P4 = 16−3 = 13. Total 30, **average 7.5**.

**Non-preemptive SJF:** at each moment a process *finishes*, choose the shortest burst among those that have already arrived.
- t = 0: only P1 has arrived, so it runs 0–6.
- t = 6: P2 (8), P3 (2), P4 (3) are waiting, so pick P3 (6–8).
- t = 8: P2 (8), P4 (3), so pick P4 (8–11).
- t = 11: P2 runs 11–19.

Waiting: P1 = 0, P3 = 6−2 = 4, P4 = 8−3 = 5, P2 = 11−1 = 10. Total 19, **average 4.75**.

The trick for exams: draw the Gantt chart first, and at every finish time, list who has arrived before choosing.

## A13 · Operating Systems

**Title:** "Port 8080 already in use": how do I find and stop the process using it?

**Tags:** ports, linux, windows, process

**Question:**
When I start my project server I get `Error: listen EADDRINUSE: address already in use :::8080`. I closed the terminal, so I don't know what is still using the port. How do I find the process and stop it, on Windows and on Linux?

**Answer:**
Something is still listening on that port (often an old server process that was never stopped).

**Windows (Command Prompt):**
```
netstat -ano | findstr :8080
taskkill /PID <pid> /F
```
The last number in the matching row is the PID.

**Linux / macOS:**
```
lsof -i :8080          # or: ss -ltnp | grep 8080
kill <pid>             # use kill -9 <pid> only if it will not stop
```

Check what the process is before killing it: it may be something you need. The cleaner long-term fix is stopping dev servers with Ctrl+C instead of closing the window, or using a different port via an environment variable.

## A14 · Operating Systems

**Title:** Banker's algorithm: how do I check if a state is safe, step by step?

**Tags:** deadlock, bankers-algorithm, exam, safe-state

**Question:**
5 processes, 3 resource types. Available = (3, 3, 2).

| | Allocation | Max |
|---|---|---|
| P0 | 0 1 0 | 7 5 3 |
| P1 | 2 0 0 | 3 2 2 |
| P2 | 3 0 2 | 9 0 2 |
| P3 | 2 1 1 | 2 2 2 |
| P4 | 0 0 2 | 4 3 3 |

Is the system in a safe state? I understand the idea but not the exact procedure.

**Answer:**
First compute **Need = Max − Allocation**:
P0 = (7,4,3), P1 = (1,2,2), P2 = (6,0,0), P3 = (0,1,1), P4 = (4,3,1).

Then keep a `Work` vector, starting as `Available = (3,3,2)`. Repeatedly find an unfinished process whose Need ≤ Work; let it finish and add its Allocation to Work.

1. P1: (1,2,2) ≤ (3,3,2) → Work = (3,3,2)+(2,0,0) = **(5,3,2)**
2. P3: (0,1,1) ≤ (5,3,2) → Work = +(2,1,1) = **(7,4,3)**
3. P4: (4,3,1) ≤ (7,4,3) → Work = +(0,0,2) = **(7,4,5)**
4. P0: (7,4,3) ≤ (7,4,5) → Work = +(0,1,0) = **(7,5,5)**
5. P2: (6,0,0) ≤ (7,5,5) → Work = +(3,0,2) = **(10,5,7)**

All five finished, so the state is **safe**, with safe sequence ⟨P1, P3, P4, P0, P2⟩. If at some step no unfinished process fits, the state is unsafe. Note that several valid safe sequences can exist; any one is a correct answer.

## A15 · Computer Networks

**Title:** How do I split 192.168.1.0/24 into 4 subnets for 4 labs with up to 50 hosts each?

**Tags:** subnetting, ipv4, cidr, exam

**Question:**
Our network assignment: one `192.168.1.0/24` block, four labs, each needing up to 50 computers. I need the subnet mask, network address, usable range and broadcast address for each lab. I don't know how to decide how many bits to borrow.

**Answer:**
**Step 1 — how many host bits?** 50 hosts need at least 50 + 2 (network and broadcast) = 52 addresses → the next power of two is 64 = 2⁶, so **6 host bits**. That makes each subnet a **/26** (32 − 6 = 26), mask **255.255.255.192**, giving 62 usable hosts.

**Step 2 — do four fit?** A /24 has 256 addresses, and 4 × 64 = 256, so yes, exactly.

| Lab | Network | Usable hosts | Broadcast |
|---|---|---|---|
| 1 | 192.168.1.0/26 | .1 – .62 | .63 |
| 2 | 192.168.1.64/26 | .65 – .126 | .127 |
| 3 | 192.168.1.128/26 | .129 – .190 | .191 |
| 4 | 192.168.1.192/26 | .193 – .254 | .255 |

Pattern: network addresses jump by the block size (64). Usable range is network + 1 to broadcast − 1. If a lab needed more than 62 hosts you would need a /25 and could not fit four equal subnets.

## A16 · Computer Networks

**Title:** `ping 8.8.8.8` works but `ping google.com` fails. What is wrong?

**Tags:** dns, ping, troubleshooting, networking

**Question:**
On my laptop, `ping 8.8.8.8` replies normally, but `ping google.com` says "could not find host" and websites don't load in the browser. Wi-Fi shows connected. What does this tell me and how do I fix it?

**Answer:**
`ping 8.8.8.8` proves you have working internet connectivity (a route to the outside). `ping google.com` needs an extra step first: **DNS** turning the name into an IP. So the network is fine and **name resolution is broken**.

Things to check:

1. `nslookup google.com`: does it fail or time out? Then your configured DNS server isn't answering.
2. Check your DNS server setting (`ipconfig /all` on Windows, `resolvectl status` on Linux). Router/ISP DNS can be down.
3. Temporarily set a public DNS (8.8.8.8, 1.1.1.1) in the adapter settings. If sites then load, the old DNS server was the problem.
4. Flush the cache: `ipconfig /flushdns`.
5. Check the `hosts` file and VPN/proxy software for odd overrides.

Good troubleshooting habit: test the IP first, then the name; the difference shows which layer is broken.

## A17 · Web Development

**Title:** CORS error when my React app calls my Express API on a different port

**Tags:** cors, react, express, fetch

**Question:**
React runs on `localhost:5173`, my Express API on `localhost:5000`. My `fetch('http://localhost:5000/api/items')` fails in the browser with *"blocked by CORS policy: No 'Access-Control-Allow-Origin' header"*. The same URL works fine in Postman. Why, and what do I change?

**Answer:**
Postman is not a browser, so it ignores CORS. Browsers enforce the same-origin policy: a page on one origin (`:5173`) may only read a response from another origin (`:5000`) if that server sends permission headers. The error means your **server** didn't send them. It's a server setting, not a bug in your `fetch`.

Fix on the server:
```js
import cors from 'cors';
app.use(cors({ origin: 'http://localhost:5173' }));
```

Or avoid CORS in development with a Vite proxy, so the browser only talks to its own origin:
```js
// vite.config.js
export default { server: { proxy: { '/api': 'http://localhost:5000' } } };
```
then call `fetch('/api/items')`. Avoid `origin: '*'` together with cookies/credentials, and never "fix" CORS by disabling browser security.

## A18 · Web Development

**Title:** React state doesn't update immediately after setState. I'm printing the old value

**Tags:** react, usestate, hooks, debugging

**Question:**
```jsx
const [count, setCount] = useState(0);
function add() {
  setCount(count + 1);
  console.log(count);   // prints the OLD value
}
```
Also, calling `setCount(count + 1)` three times in a row only increases it by 1. Is React broken?

**Answer:**
No. `setCount` doesn't change the variable `count` in the current render; it **schedules** a re-render. The `count` inside `add()` is a snapshot from the render that created that function, so `console.log(count)` still shows the old value. The new value appears in the *next* render.

For the three-calls problem, each call used the same snapshot (`0 + 1`), so you set it to 1 three times. Use the functional form, which always receives the latest value:

```jsx
setCount(c => c + 1);
setCount(c => c + 1);
setCount(c => c + 1);   // now count goes up by 3
```

To react to the new value, use `useEffect(() => { ... }, [count])` or simply compute things from `count` during render.

## A19 · Web Development

**Title:** What is the simplest way to center a div horizontally and vertically in CSS?

**Tags:** css, flexbox, grid, layout

**Question:**
I've tried `margin: auto`, `text-align: center` and `vertical-align: middle` and nothing centers my login box both ways. What is the modern, reliable way?

**Answer:**
Make the parent a grid (or flex) container and center its children:

```css
.page {
  min-height: 100vh;        /* gives the parent height to center within */
  display: grid;
  place-items: center;
}
```
Flexbox version:
```css
.page {
  min-height: 100vh;
  display: flex;
  justify-content: center;  /* horizontal */
  align-items: center;      /* vertical */
}
```

Why your attempts failed: `text-align` only centers inline content, `vertical-align` applies to inline/table-cell elements, and `margin: auto` centers a block horizontally only. The parent also needs an explicit height, which is the most common reason vertical centering "doesn't work".

## A20 · Web Development

**Title:** How should I store passwords in my college project's login system?

**Tags:** security, passwords, bcrypt, authentication

**Question:**
For my project I save the password in the database exactly as the user typed it, and compare strings at login. My teacher said this is unsafe. What should I do instead, and is MD5 or SHA-256 good enough?

**Answer:**
Never store plain-text passwords: a database leak exposes every account (and users reuse passwords elsewhere). Also don't use plain MD5 or SHA-256: they are built to be fast, so attackers can test billions of guesses per second, and identical passwords produce identical hashes.

Use a **slow, salted password-hashing function**: bcrypt, scrypt or Argon2. They add a random salt automatically and have a tunable cost.

```js
import bcrypt from 'bcrypt';

// signup
const hash = await bcrypt.hash(password, 12);   // store only the hash

// login
const ok = await bcrypt.compare(password, user.passwordHash);
```

Also: enforce a minimum length, rate-limit login attempts, never log passwords, and send them only over HTTPS. You cannot "decrypt" the hash. At login you hash the typed password and compare, which is how it should work.

---

# Part B — Questions only, left open for the community (10)

Post these **without** answers. They are real, answerable doubts, and they give other students something to help with.

## B1 · Data Structures

**Title:** How do I solve recurrences like T(n) = 2T(n/2) + n using the Master theorem?

**Tags:** recurrence, master-theorem, complexity, algorithms

**Question:**
I understand what time complexity is, but I get stuck on recurrence relations. For `T(n) = 2T(n/2) + n` I can't tell which of the three cases of the Master theorem applies, and I don't know what to do when the form doesn't match (like `T(n) = 2T(n/2) + n log n`).

Could someone show the steps for these two, and explain how you decide which case you are in?

## B2 · Data Structures

**Title:** AVL tree: how do I know which rotation to use when I insert 10, 20, 30, 40, 50, 25?

**Tags:** avl-tree, rotations, trees, exam

**Question:**
I'm inserting 10, 20, 30, 40, 50, 25 into an empty AVL tree. After 30 I understand one rotation. After that I lose track of balance factors and don't know whether I need LL, RR, LR or RL.

Can someone walk through each insertion and show the tree after every rotation, and explain how to recognise the four cases quickly?

## B3 · DBMS

**Title:** When should I use a VIEW instead of making a copy table for reports?

**Tags:** sql, view, database-design, reports

**Question:**
For my project I need a "top students by marks" report that I query a lot. I could create a table and fill it with a copy of the data, or create a `VIEW`. What are the real differences, what happens when the underlying data changes, and when would the copy table be the better choice?

## B4 · DBMS

**Title:** Why do databases use B+ trees for indexes instead of plain B trees or binary trees?

**Tags:** indexing, b-plus-tree, storage, dbms

**Question:**
Our syllabus mentions B and B+ trees. I can draw both, but I can't explain *why* nearly every database index is a B+ tree. What do B+ trees give you for range queries and disk reads that a B tree or a binary search tree doesn't?

## B5 · Java

**Title:** How do I make two threads print odd and even numbers alternately?

**Tags:** java, multithreading, wait-notify, interview

**Question:**
I want one thread to print odd numbers and another even numbers, so the output is 1, 2, 3, 4, ... in order up to 20. My attempt with two plain threads prints them mixed up in random order. I've heard about `wait()`/`notify()` but I don't know how to structure it. What's a clean way to do this?

## B6 · Operating Systems

**Title:** Paging vs segmentation: what's the practical difference, and what does Linux actually use?

**Tags:** memory-management, paging, segmentation, os

**Question:**
My notes define both, but in an exam answer I can only say "paging has fixed-size blocks, segmentation has variable-size". What does each one solve in practice, what problem does each one have, and which is used by a real OS like Linux on modern hardware?

## B7 · Computer Networks

**Title:** Hub vs switch vs router: collision domains and broadcast domains explained?

**Tags:** networking, switch, router, collision-domain

**Question:**
I know a router connects networks and a switch connects devices in one network, but exam questions ask "how many collision domains and broadcast domains" in a diagram with hubs, switches and a router, and I can't get the counts right. How do I count them, and what exactly changes at each device?

## B8 · Mathematics

**Title:** Ratio test or root test? How do I choose for a series convergence question?

**Tags:** series, convergence, ratio-test, calculus

**Question:**
For series like `Σ n!/nⁿ` and `Σ (n/(2n+1))ⁿ` I can apply a test, but I never know which one is the fastest, and sometimes the ratio test gives a limit of exactly 1 and I'm stuck. Is there a rule of thumb for choosing, and what do I try when the ratio test is inconclusive?

## B9 · Statistics

**Title:** t-test or z-test for a small sample from my lab measurements?

**Tags:** hypothesis-testing, t-test, z-test, sample

**Question:**
I measured the resistance of a component 12 times and want to test whether the true mean equals the value printed on it. I don't know the population standard deviation. My notes show both a z-test and a t-test. Which applies here and why, and what changes as the sample gets bigger?

## B10 · Web Development

**Title:** How can I deploy my React + Express project for free so the demo works on any laptop?

**Tags:** deployment, react, express, project-demo

**Question:**
My college project has a React frontend, an Express backend and MongoDB. It only runs on my laptop. For the demo I'd like a public link that works on the teacher's computer without installing anything. What free options exist, how should I split the frontend and backend, and what do I need to configure (environment variables, CORS, database access) so it doesn't break on the day?

---

## Posting checklist

- [ ] Removed every question I don't genuinely relate to; replaced with real ones from my syllabus
- [ ] Ran or checked each answer before posting it
- [ ] Spread the posts over several days and several real accounts
- [ ] Asker accepted the answer for the Part A items
- [ ] Left Part B open and pinged classmates to answer them
