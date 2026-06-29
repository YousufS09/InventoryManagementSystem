import styles from "./StatCard.module.css";

type Props = {
  title: string;
  value: string;
};

const StatCard = ({
  title,
  value,
}: Props) => {
  return (
    <div className={styles.card}>
      <p>{title}</p>

      <h2>{value}</h2>
    </div>
  );
};

export default StatCard;