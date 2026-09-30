# ServC Job Card

Multi-step service intake job card for ServC. Three pages:

1. **Customer / CRM** — name, phone, email, address, GST, PAN  
2. **Vehicle** — details, required photo angles, issues & maintenance  
3. **Close-out** — test ride comments, customer inputs, preliminary estimate + mock email/WhatsApp notify  

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui-style primitives.

## Run locally

```bash
npm install
npm run dev -- -p 4317
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317).

Email and WhatsApp send are **mocked** (`POST /api/notify`). Payloads are logged to the server console — no credentials required.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev -- -p 4317` | Dev server on port 4317 |
| `npm run build` | Production build |
| `npm start` | Start production server |
