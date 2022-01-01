'use strict';

// get id of tags with document 
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const connectbtn = document.getElementById('connect-btn');

// button click for remoteVideo stream 
connectbtn.onclick = call;

let stream;
let startTime;
let peer1; // local
let peer2; // remote

//An object providing the following options requested for the offer
const offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  };

  //The CreateStream method creates and opens a stream object in this storage object.
async function createStream(){
    if(stream){
        return stream;
    }
    if(localVideo.captureStream){
        //captureStream: returns a MediaStream object which is streaming a real-time capture of the content being rendered in the media element.
        stream = localVideo.captureStream();
    }else{
        console.log('captureStream() doenst work');
    }
}

//The onloadedmetadata event occurs when meta data for the specified audio/video has been loaded.
remoteVideo.onloadedmetadata = () => {
    console.log(`Remote video videoWidth: ${remoteVideo.videoWidth}px,  videoHeight: ${remoteVideo.videoHeight}px`);
  };


//occurs when the browser window has been resized
remoteVideo.onresize = () => {
  console.log(`Remote video size changed to ${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`);
  // We'll use the first onresize callback as an indication that
  // video has started playing out.
  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    console.log('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
    startTime = null;
  }
};

function call(){

    // function to run when media is ready
    localVideo.oncanplay = createStream;
    if(localVideo.readyState >=3){
        createStream();
    }
    localVideo.play();

    // starting call
    startTime = window.performance.now();
    
    const server = null;
    // RTCPeerConnection: represents a WebRTC connection between the local computer and a remote peer.
    peer1 = new RTCPeerConnection(server);
    peer1.onicecandidate = e =>onIceCandidate(peer1, e);

    peer2 = new RTCPeerConnection(server);
    peer2.onicecandidate = e =>onIceCandidate(peer2, e);

    // oniceconnectionstatechange: This happens when the state of the connection's ICE agent, as represented by the iceConnectionState property, changes.
    peer1.oniceconnectionstatechange = e => onIceStateChange(peer1, e);
    peer2.oniceconnectionstatechange = e => onIceStateChange(peer2, e);
    peer2.ontrack = receiveStream;

    stream.getTracks().forEach(track => peer1.addTrack(track, stream));

    //createOffer : creation of an SDP offer for the purpose of starting a new WebRTC connection to a remote peer
    peer1.createOffer(onCreateOfferSuccess, onCreateSessionDescriptionError, offerOptions);
}

// offer from peer1
function onCreateOfferSuccess(desc){
    
    //peer1 setLocalDescription start
    peer1.setLocalDescription(desc, () => onSetLocalSuccess(peer1), onSetSessionDescriptionError);

    //peer2 setLocalDescription start
    peer2.setRemoteDescription(desc, () => onSetRemoteSuccess(peer2), onSetSessionDescriptionError);

    // createAnswer creates an SDP answer to an offer received from a remote peer during the offer/answer negotiation of a WebRTC connection
    peer2.createAnswer(onCreateAnswerSuccess, onCreateSessionDescriptionError);
}


// the function gives error message on failed create session situation
function onCreateSessionDescriptionError(error) {
    console.log(`Failed to create session description: ${error.toString()}`);
  }

  // the below functions are that to give error or success message in localDescription complete or not case
  function onSetLocalSuccess(pc) {
    console.log(`${getName(pc)} setLocalDescription complete`);
  }
  
  function onSetRemoteSuccess(pc) {
    console.log(`${getName(pc)} setRemoteDescription complete`);
  }
  
  function onSetSessionDescriptionError(error) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }


//To receive the remote tracks that were added by the other peer
  function receiveStream(event) {
    if (remoteVideo.srcObject !== event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      console.log('peer2 received remote stream', event);
    }
  }


   // Answer from peer2
  function onCreateAnswerSuccess(desc) {
   
    // peer2 setLocalDescription start
    console.log(`Answer from peer2: ${desc.sdp}`);
    peer2.setLocalDescription(desc, () => onSetLocalSuccess(peer2), onSetSessionDescriptionError);

    // peer1 setRemoteDescription start
    peer1.setRemoteDescription(desc, () => onSetRemoteSuccess(peer1), onSetSessionDescriptionError);
  }

  // lets the ICE agent perform negotiation with the remote peer without the browser itself needing to know any specifics about the technology being used for signaling
  function onIceCandidate(peer, event) {
    getOtherPc(peer).addIceCandidate(event.candidate)
        .then(
            () => onAddIceCandidateSuccess(peer),
            err => onAddIceCandidateError(peer, err)
        );
    console.log(`${getName(peer)} ICE candidate: 
  ${event.candidate ?
      event.candidate.candidate : '(null)'}`);
  }

  // ? 
  function onIceStateChange(pc, event) {
    if (pc) {
      console.log(`${getName(pc)} ICE state: ${pc.iceConnectionState}`);
      console.log('ICE state change event: ', event);
    }
  }

  // The below functions are that to give message in candidate case
  function onAddIceCandidateSuccess(peer) {
    console.log(`${getName(peer)} addIceCandidate success`);
  }
  
  function onAddIceCandidateError(peer, error) {
    console.log(`${getName(peer)} failed to add ICE Candidate: ${error.toString()}`);
  }

  
  // to get name peer1 and peer2
  function getName(peer) {
    return (peer === peer1) ? 'peer1' : 'peer2';
  }
  
  function getOtherPc(peer) {
    return (peer === peer1) ? peer2 : peer1;
  }

