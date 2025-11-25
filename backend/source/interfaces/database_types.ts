interface User {
    id: bigint,
    username: string,
    display_name: string,
    email: string | Buffer,
    mfa: boolean,
    verified_email: boolean,
    verified: boolean,
    banned: boolean,
    registered_at?: string
}

export type { User };