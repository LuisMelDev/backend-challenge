import { User } from 'src/auth/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'files' })
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  url: string;

  @Column('text', {
    unique: true,
  })
  fileName: string;

  @Column('text', {
    select: false,
  })
  key: string;

  @ManyToOne(() => User, (user) => user.files, {
    onDelete: 'CASCADE',
  })
  user: User;
}
