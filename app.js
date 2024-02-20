const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

app.use(express.json());

let db = null;

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running On Port 3000");
    });
  } catch (error) {
    console.log(`DB Error : ${error}`);
    process.exit(1);
  }
};

initializeDbServer();

//To return a list of all states in the state table

app.get("/states/", async (request, response) => {
  const toGetWholeStatesQuery = `SELECT 
  state_id AS stateId,state_name AS stateName,
  population FROM state;`;
  const result = await db.all(toGetWholeStatesQuery);
  response.send(result);
});

//To return a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const toGetAStateDataQuery = `SELECT state_id AS stateId
  ,state_name AS stateName,
  population FROM state 
    WHERE state_id=${stateId};`;
  const result = await db.get(toGetAStateDataQuery);
  response.send(result);
});

//To create a district in the district table,
// district_id is auto-incremented

app.post("/districts/", async (request, response) => {
  const gottenData = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = gottenData;
  const insertNewDistrictDataQuery = `INSERT INTO 
    district(district_name,state_id,cases,cured,
        active,deaths) 
    VALUES ('${districtName}',${stateId},${cases},
    ${cured},${active},${deaths});`;
  await db.run(insertNewDistrictDataQuery);
  response.send("District Successfully Added");
});

//to return a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const toGetADistrictDataQuery = `SELECT 
  district_id AS districtId,district_name As districtName,
  state_id As stateId,cases,cured,active,deaths FROM district 
    WHERE district_id=${districtId};`;
  const result = await db.get(toGetADistrictDataQuery);
  response.send(result);
});

//To delete a district from the district table
//based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const toDeleteADistrictQuery = `DELETE FROM district 
    WHERE district_id=${districtId};`;
  await db.run(toDeleteADistrictQuery);
  response.send("District Removed");
});

//To update the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const gottenData = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = gottenData;
  const toUpdateDistrictQuery = `UPDATE district SET 
    district_name='${districtName}',state_id=${stateId},cases=${cases},
    cured=${cured},active=${active},deaths=${deaths};`;
  await db.run(toUpdateDistrictQuery);
  response.send("District Details Updated");
});

//To return the statistics of total cases, cured, active, deaths
// of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const toGETAStateStatusQuery = `SELECT 
  SUM(cases) AS totalCases, SUM(cured) AS totalCured,
  SUM(active) AS totalActive,
  SUM(deaths) AS totalDeaths FROM state 
  INNER JOIN district 
  ON state.state_id=district.state_id 
  WHERE state.state_id=${stateId};`;
  const [result] = await db.all(toGETAStateStatusQuery);
  response.send(result);
});

//To return an object containing the state name
//of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const toGetStateNameQuery = `SELECT state_name 
  AS stateName 
    FROM state INNER JOIN district 
    ON state.state_id=district.state_id 
    WHERE district_id=${districtId};`;
  const [result] = await db.all(toGetStateNameQuery);
  response.send(result);
});

module.exports = app;
