import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext.jsx";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "./Contact";
import ImagePreview from "./ImagePreview";
import VideoPreview from "./VideoPreview";
import DocumentPreview from "./DocumentPreview";
import LinkPreview from "./LinkPreview";

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const { username, id, setId, setUsername } = useContext(UserContext);
  const divUnderMessages = useRef();
  const [sidebarVisible, setSidebarVisible] = useState(true);


  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  }; 

  useEffect(() => {
    connectToWs();
  }, [selectedUserId]);

  function connectToWs() {
    const ws = new WebSocket('ws://localhost:4040');
    setWs(ws);
    ws.addEventListener('message', handleMessage);
    ws.addEventListener('close', () => {
      setTimeout(() => {
        console.log('Disconnected. Trying to reconnect.');
        connectToWs();
      }, 1000);
    });
  }

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    if ('online' in messageData) {
      showOnlinePeople(messageData.online);
    } else if ('text' in messageData) {
      if (messageData.sender === selectedUserId) {
        setMessages(prev => ([...prev, { ...messageData }]));
      }
    }
  }

  function logout() {
    axios.post('/logout').then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
    });
  }

  function sendMessage(ev, file = null) {
    if (ev) ev.preventDefault();
    ws.send(JSON.stringify({
      recipient: selectedUserId,
      text: newMessageText,
      file,
    }));
    if (file) {
      axios.get('/messages/' + selectedUserId).then(res => {
        setMessages(res.data);
      });
    } else {
      setNewMessageText('');
      setMessages(prev => ([...prev, {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      }]));
    }
  }

  function sendFile(ev) {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  useEffect(() => {
    axios.get('/people')
      .then(res => {
        const allPeople = res.data.filter(p => p._id !== id);
        const onlinePeopleSet = new Set(Object.keys(onlinePeople));
        const offlinePeopleArr = allPeople.filter(p => !onlinePeopleSet.has(p._id));
        const offlinePeopleObj = offlinePeopleArr.reduce((acc, person) => {
          acc[person._id] = person;
          return acc;
        }, {});
        setOfflinePeople(offlinePeopleObj);
        console.log('Offline People:', offlinePeopleObj); // Debugging log
      })
      .catch(error => {
        console.error("Error fetching people: ", error);
      });
  }, [onlinePeople, id]);
  

  useEffect(() => {
    if (selectedUserId) {
      axios.get('/messages/' + selectedUserId).then(res => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];

  const messagesWithoutDupes = uniqBy(messages, '_id');

  function renderPreview(message) {
    if (message.file) {
      const fileExtension = message.file.split('.').pop().toLowerCase();
      const fileUrl = `${axios.defaults.baseURL}/uploads/${message.file}`;
      
      if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
        return <ImagePreview src={fileUrl} alt="Image preview" />;
      } else if (['mp4', 'webm'].includes(fileExtension)) {
        return <VideoPreview src={fileUrl} />;
      } else if (['pdf', 'doc', 'docx'].includes(fileExtension)) {
        return <DocumentPreview src={fileUrl} />;
      } else if (message.text && message.text.startsWith('http')) {
        return <LinkPreview url={message.text} title={new URL(message.text).hostname} description="Link preview" />;
      }
    }
    return null;
  }

   return (
    <div className="flex h-screen">
    {/* Sidebar */}
    {sidebarVisible && (
      <div className="bg-white w-1/4 flex flex-col border-r border-gray-200 shadow-md transition-transform duration-300 ease-in-out">
        <div className="flex-grow p-4 space-y-2 overflow-y-auto">
          <Logo />
          {Object.keys(onlinePeopleExclOurUser).map(userId => (
            <Contact
              key={userId}
              id={userId}
              online={true}
              username={onlinePeopleExclOurUser[userId]}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
              className="transition-transform transform hover:scale-105"
            />
          ))}
          {Object.keys(offlinePeople).map(userId => (
            <Contact
              key={userId}
              id={userId}
              online={false}
              username={offlinePeople[userId].username}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
              className="transition-transform transform hover:scale-105"
            />
          ))}
        </div>
        <div className="p-4 text-center flex items-center justify-center bg-gray-100 border-t border-gray-200">
          <span className="mr-2 text-sm text-gray-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
            {username}
          </span>
          <button
            onClick={logout}
            className="text-sm bg-blue-100 py-1 px-2 text-gray-500 border border-blue-300 rounded-md hover:bg-blue-200 transition-colors duration-300">Logout</button>
        </div>
      </div>
    )}
      
      {/* Chat Area */}
      <div className={`flex flex-col bg-blue-50 w-full p-4 space-y-4 transition-all duration-300`}>
        <div className="flex-grow relative">
          {!selectedUserId && (
            <div className="flex h-full items-center justify-center">
              <div className="text-gray-400 text-lg">Select a person from the sidebar</div>
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-16 pr-2">
                {messagesWithoutDupes.map(message => (
                  <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                    <div className={`inline-block p-3 my-2 rounded-md text-sm ${message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 shadow-md'}`}>
                      {message.text}
                      {renderPreview(message)}
                      <div className="text-xs text-gray-900 mt-1">
                      {new Date(message.createdAt).toLocaleString('en-US', {
                      
                       month: 'short',
                       day: 'numeric',
                        hour: '2-digit',
                      minute: '2-digit',
                                  })}
                        </div>
                      </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={ev => setNewMessageText(ev.target.value)}
              placeholder="Type your message here"
              className="flex-grow border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <label className="bg-blue-200 p-2 text-gray-600 rounded-md border border-blue-300 cursor-pointer hover:bg-blue-300 transition-colors duration-300">
              <input type="file" className="hidden" onChange={sendFile} />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v4.5h4.5M21 7.5V3h-4.5M21 21l-6-6M3 3l6 6M10.5 7.5l7.5 7.5M16.5 12l3 3M10.5 16.5l-6-6M10.5 21H3v-7.5M21 7.5V3h-4.5M21 21l-6-6M3 3l6 6M10.5 7.5l7.5 7.5M16.5 12l3 3M10.5 16.5l-6-6M10.5 21H3v-7.5" />
              </svg>
            </label>
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-md border border-blue-500 hover:bg-blue-600 transition-colors duration-300">
              Send
            </button>
          </form>
        )}
      </div>

      {/* Toggle Button */}
      <button
  onClick={toggleSidebar}
  className="absolute top-4 left-4 p-2 bg-blue-100 text-white rounded-md shadow-md md:hidden z-10">
  {sidebarVisible ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6">
      <path
        fillRule="evenodd"
        d="M6.225 5.982a.75.75 0 011.06 0L12 10.698l4.715-4.716a.75.75 0 111.06 1.06L13.06 11.757l4.715 4.716a.75.75 0 01-1.06 1.06L12 12.818l-4.715 4.715a.75.75 0 01-1.06-1.06l4.715-4.716-4.715-4.715a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className="w-6 h-6">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16m-7 6h7"
      />
    </svg>
  )}
</button>

    </div>
  );

}
