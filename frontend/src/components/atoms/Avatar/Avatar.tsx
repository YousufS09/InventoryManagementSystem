import styles from "./Avatar.module.css";

type AvatarProps = {
  username: string;
};

const Avatar = ({ username }: AvatarProps) => {
  return (
    <img
      className={styles.avatar}
      src={`https://ui-avatars.com/api/?name=${username}&background=2563eb&color=fff`}
      alt={username}
    />
  );
};

export default Avatar;