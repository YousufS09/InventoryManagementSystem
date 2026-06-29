import Avatar from "../../atoms/Avatar/Avatar";
import styles from "./ProfileCard.module.css";

type Props = {
  username: string;
};

const ProfileCard = ({ username }: Props) => {
  return (
    <div className={styles.profileCard}>
      <Avatar username={username} />

      <div>
        <h4 className={styles.username}>
          {username}
        </h4>

        <span className={styles.status}>
          ● Online
        </span>
      </div>
    </div>
  );
};

export default ProfileCard;