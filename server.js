import http from "http";
import { connect } from "http2";
import mysql from "mysql2/promise";

async function startServer() {
  const PORT = 5000;
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "phpmyadmin",
    password: "rootroot",
    database: "temperaturas23060350"
  });

  const server = http.createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, UPDATE, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      return res.end();
    }

    if (req.method === "GET" && req.url === "/getTemperatures") {
      const [temperatures] = await connection.execute(
        "SELECT * FROM registros JOIN lugares ON registros.lugar_id = lugares.id"
      );
      res.writeHead(200);
      return res.end(JSON.stringify(temperatures));
    }

    if (req.method === "POST" && req.url === "/insertTemperature") {
      let body = "";

      req.on("data", chunk => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { lugar_id, temperatura, fecha_hora, emailValue, passwordValue } = JSON.parse(body);

          const [lugarExists] = await connection.execute("SELECT * FROM lugares WHERE id = ?", [lugar_id]);

          console.log(lugarExists);

          if (lugarExists.length === 0) {
            res.writeHead(401);
            return res.end(JSON.stringify({
              success: false,
              message: "El lugar no existe"
            }));
          }

          const [users] = await connection.execute(
            "SELECT * FROM usuarios WHERE email = ? AND contrasena = ?",
            [emailValue, passwordValue]
          );

          if (users.length === 0) {
            res.writeHead(401);
            return res.end(JSON.stringify({
              success: false,
              message: "Usuario o contraseña incorrectos"
            }));
          }

          const [result] = await connection.execute(
            "INSERT INTO registros (lugar_id, fecha_hora, temperatura) VALUES (?, ?, ?)",
            [lugar_id, fecha_hora, temperatura]
          );

          res.writeHead(200);
          return res.end(JSON.stringify({
            success: true,
            insertId: result.insertId
          }));

        } catch (err) {
          console.error(err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Error al insertar registro" }));
        }
      });

      return;
    }
    if (req.method === "POST" && req.url === "/insertPlace") {
      let body = "";

      req.on("data", chunk => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { placeValue } = JSON.parse(body);

          const [lugarExists] = await connection.execute("SELECT * FROM lugares WHERE nombre = ?", [placeValue]);

          console.log(lugarExists);

          if (lugarExists.length > 0) {
            res.writeHead(401);
            return res.end(JSON.stringify({
              success: false,
              message: "El lugar ya existe"
            }));
          }


          const [result] = await connection.execute(
            "INSERT INTO lugares (id, nombre) VALUES (null, ?)", [placeValue]
          );

          res.writeHead(200);
          return res.end(JSON.stringify({
            success: true,
            insertId: result.insertId
          }));

        } catch (err) {
          console.error(err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Error al insertar registro" }));
        }
      });

      return;
    }

    if (req.method === "POST" && req.url === "/insertUser") {
      let body = "";

      req.on("data", chunk => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { name, email, password } = JSON.parse(body);

          const [emailExists] = await connection.execute(
            "SELECT nombre FROM usuarios WHERE email = ?",
            [email]
          );

          if (emailExists.length > 0) {
            return res.end(JSON.stringify({
              success: false,
              message: "El email ya existe",
              nameFound: emailExists[0].nombre,
              password: password
            }));
          }

          const [result] = await connection.execute(
            "INSERT INTO usuarios (nombre, email, contrasena) VALUES (?, ?, ?)",
            [name, email, password]
          );

          res.writeHead(200);
          return res.end(JSON.stringify({
            success: true,
            insertId: result.insertId,
            message: "Usuario insertado correctamente",
            password: password
          }));

        } catch (err) {
          console.error(err);
          res.writeHead(500);
          res.end(JSON.stringify({ error: "Error al insertar usuario" }));
        }
      });

      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: "URL no encontrada" }));
  });

  server.listen(5000, "0.0.0.0", () => {
    console.log("Servidor corriendo");
  });
}

await startServer();
