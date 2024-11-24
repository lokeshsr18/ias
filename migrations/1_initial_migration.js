const ms= artifacts.require("MessageStorage");

module.exports = function(deployer) {
  deployer.deploy(ms)
  .then(() => {
    console.log('MessageStorage deployed');
  })
  .catch((err) => {
    console.error('Deployment failed:', err);
  });
};
