const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return;
  requestQuery.priority !== undefined && requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//GET
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let data = null;
  let getQuery = "";

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                    AND priority = '${priority}'
                    AND status = '${status}';

            
            `;
      break;
    case hasPriority(request.query):
      getQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                    AND priority = '${priority}';
                    
            `;
      break;
    case hasStatus(request.query):
      getQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                    AND status = '${status}';
                    
            `;
      break;

    default:
      getQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%';
            `;
      break;
  }
  data = await db.all(getQuery);
  response.send(data);
});

//GET(Returns a specific todo based on the todo ID)
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoQuery = `
        SELECT
            *
        FROM
            todo
        WHERE
            id = ${todoId};
    
    `;
  const dbResponse = await db.get(getSpecificTodoQuery);
  response.send(dbResponse);
});

//POST(Create a todo in the todo table)
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodo = `
            INSERT INTO
                todo(id,todo,priority,status)
            VALUES(
                ${id},
                '${todo}',
                '${priority}',
                '${status}'
                );
    
    `;
  await db.run(createTodo);
  response.send("Todo Successfully Added");
});

//PUT(Updates the details of a specific todo based on the todo ID)
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updateQuery = "";
  let updateColumn = "";

  switch (true) {
    case request.body.status !== undefined:
      updateColumn = `Status`;
      break;
    case request.body.priority !== undefined:
      updateColumn = `Priority`;
      break;
    case request.body.todo !== undefined:
      updateColumn = `Todo`;
      break;
  }
  let previousTodo = `
        SELECT
            *
        FROM
            todo
        WHERE
            id = ${todoId};
  
  `;
  const previousTodoObj = await db.get(previousTodo);
  const {
    status = previousTodoObj.status,
    priority = previousTodoObj.priority,
    todo = previousTodoObj.todo,
  } = request.body;

  updateQuery = `
        UPDATE
            todo
        SET
            status = '${status}',
            priority = '${priority}',
            todo = '${todo}'
        WHERE
            id = ${todoId}
  
  `;

  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

//DELETE(Deletes a todo from the todo table based on the todo ID)
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
            DELETE FROM
                todo
            WHERE
                id = ${todoId};
    
    `;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
