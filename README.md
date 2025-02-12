# node-api-validator
# 🎴 Node.js Card Validation API

This is a **Node.js API** that validates card decks based on specific rules. It processes a list of cards, checks for validity, logs the validation process, and supports concurrent requests.

---

## 📌 Features
- ✅ Accepts different card formats (objects, arrays, strings)
- ✅ Ensures `"D"` is always paired with `3`
- ✅ Logs validation and errors using **Winston**
- ✅ Maintains request history for debugging

## 🚀 Installation & Setup

### 1️⃣ Clone the Repository**
git clone https://github.com/Kunal7636/node-api-validator.git

### 2️⃣ Install Dependencies
npm install
### 3️⃣ Start the Server
node server.js

##API Endpoints
1️⃣ Validate Cards
➡️ POST /validate-cards
Validates a list of cards and returns valid and invalid cards.

📥 Request Body:
[
  { "letter": "A", "number": 3 },
  ["D", 5],
  "C, 9"
]

2️⃣ Fetch Validation History
➡️ GET /history
## 📌 Project Dependencies

| Package   | Description                                |
|-----------|--------------------------------------------|
| express   | Web framework for building APIs           |
| joi       | Input validation                          |
| winston   | Logging framework                         |

