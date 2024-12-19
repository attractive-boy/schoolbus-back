// db.js
import knex from "knex";

const db = knex({
  client: process.env.DB_CLIENT || 'mysql2',  // 默认为 mysql2
  connection: {
    host: process.env.DB_HOST,  // 从环境变量获取 IP 地址
    user: process.env.DB_USER,  // 从环境变量获取用户名
    password: process.env.DB_PASSWORD,  // 从环境变量获取密码
    database: process.env.DB_NAME,  // 从环境变量获取数据库名
    port: Number(process.env.DB_PORT) || 3306,  // 从环境变量获取端口
  },
  pool: { min: 0, max: 7 },  // 连接池配置
});
console.log("db connected==>",process.env.DB_HOST);
export default db;
