import { Avatar } from './ui/avatar';
import { Card } from './ui/card';

interface ProfileHeaderProps {
  name: string;
  age: number;
  city?: string;
  bio?: string;
  photo?: string;
}

export function ProfileHeader({ name, age, city, bio, photo }: ProfileHeaderProps) {
  return (
    <Card className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Avatar src={photo} alt={name} className="h-16 w-16" />
        <div>
          <h1 className="text-2xl font-bold text-[#111]">{name} · {age}</h1>
          {city ? <p className="text-gray-600">{city}</p> : null}
        </div>
      </div>
      {bio ? <p className="max-w-2xl text-gray-700">{bio}</p> : null}
    </Card>
  );
}
