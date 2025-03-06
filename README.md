# Chat Simulation Playground

A minimalist but powerful tool for simulating and experimenting with AI chat applications. This playground allows you to effortlessly create, edit, and test conversational scenarios.

## Features

- **Notebook-style Interface**: Create, edit, and delete messages in a notebook-like interface
- **Multi-role Support**: Simulate system, user, and assistant messages
- **Temperature Control**: Adjust generation temperature for varied outputs
- **Import/Export**: Save and load conversation scenarios
- **Minimal UI**: Clean, functional interface focusing on utility

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. **Creating Messages**: Use the "Add Message" cell to add new messages to the conversation
2. **Editing Messages**: Click "Edit" on any message to modify its content
3. **Deleting Messages**: Click "Delete" to remove a message from the conversation
4. **Adjusting Parameters**: Use the configuration panel to set the temperature
5. **Simulating**: Click "Simulate Chat" to generate a response based on the conversation history
6. **Saving/Loading**: Use "Export" to save your scenario and "Import" to load it

## Integration

This playground is designed to be easily integrated with different AI backends. The simulation function can be modified to call any AI model API.

## Built With

- [Next.js](https://nextjs.org)
- React
- TypeScript
- Tailwind CSS
