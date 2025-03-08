Note to Claude: I'm planning to migrate this frontend only app to fullstack with 
a FastAPI backend and persistent sqlite. I will likely use Tanstack Query as well but 
that's a design choice I'm still considering. 


chats = [
    {
        id,
        name,
        date,
        messages: [
            {
                id
                role: system | user | assistant,
                content: string
                position: int
            }
        ]
        temperature: number,
        settings: [
            {
                type: input | select | multiselect | toggle | json
                name: string
                data: jsonb
            }
        ]
    }
]