const response = pm.response.json();

pm.test("Agent A login successful", () => {
    pm.response.to.have.status(200);
});

pm.collectionVariables.set("agentAToken", response.token);