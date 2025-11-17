var Client = require('castv2-client').Client;
var DefaultMediaReceiver  = require('castv2-client').DefaultMediaReceiver;

DefaultMediaReceiver.APP_ID = "D0792F6F";

ondeviceup("192.168.100.128");

function ondeviceup(host) {

  var client = new Client();

  client.connect(host, function() {
    console.log('connected, launching app ...');

    client.launch(DefaultMediaReceiver, function(err, player) {
      var media = {
        contentId: '1679278167',
        contentType: 'applemusic',
        customData: {
            credentials: "ArtrW+GDMTxB5jIO2G1yBU1NqGdY4hqxDIZdnY17Knmg6Q0q2POjahUroexArY5nWdC0vviL8cS9dntXsvoP2G+JwCSMW/tjZRwrq1iF39TSDFfBi3lcklcGm/6s+LeAIBvICW1EaffwqrPhSGpEZQqR6jX/4sEhUxFstfMQ7bxNV03I1Lue4fKtUrfDftaxa8t025i6JXx3FQuh8naAklYXfUl7FoNRWdEGbnjFFPdYdQKYrg==",
        }
      };

      player.on('status', function(status) {
        console.log('status broadcast playerState=%s', status.playerState);
      });

      console.log('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);

      player.load(media, { autoplay: true }, function(err, status) {
        console.log('media loaded playerState=%s', status.playerState);

      });

    });
    
  });

  client.on('error', function(err) {
    console.log('Error: %s', err.message);
    client.close();
  });

}