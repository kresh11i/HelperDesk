// Admin login
const response = pm.response.json();

pm.test("Login successful", () => {
    pm.response.to.have.status(200);
});

pm.collectionVariables.set("adminToken", response.token);