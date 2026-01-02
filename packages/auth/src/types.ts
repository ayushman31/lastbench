export type User = {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    avatar: string | null;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  
  export type Session = {
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
      token: string;
      ipAddress?: string;
      userAgent?: string;
      createdAt: Date;
      updatedAt: Date;
    };
    user: User;
  };