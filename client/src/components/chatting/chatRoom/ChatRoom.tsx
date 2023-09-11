import React, { useEffect, useState } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import * as Webstomp from "webstomp-client";
import { useRecoilState, useRecoilValue } from "recoil";
import { currentChatRoomIdState, chatState } from "../recoil/chatState";
import MessageBubble from "./MessageBubble";
import ChatRoomHttp from "./ChatRoomHttp";
import FormatTimeOrDate from "../hook/FormatTimeOrDate";
import { webSocketConnectionState } from "../recoil/chatState";
import moment from "moment";
import { useSearchParams } from "react-router-dom";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 90%; // 상대적인 단위로 변경
  height: 43.6875rem;
  padding: 1.5rem 1rem;

  justify-content: end;

  border-radius: 0.375rem;
  border: 1px solid #e0e0e0;
  background: #f7f7f7;
  /* background-color: aqua; */

  .startText {
    color: #494949;
    font-family: Pretendard Variable;
    font-size: 1rem;
    font-style: normal;
    font-weight: 400;
    line-height: normal;
    padding: 0.9375rem;
    .date {
      padding: 0.9375rem;
      font-size: 1rem;
    }
  }

  .chatBox {
    overflow-y: auto; /* 내용이 넘칠 경우 스크롤 표시 */

    &::-webkit-scrollbar {
      width: 0px;
    }
    /* &::-webkit-scrollbar-thumb {
      border-radius: 6px;
      background: #ccc;
    } */
  }
  @media (max-width: 64rem) {
    width: 95%; // 상대적인 단위로 변경
  }
`;
interface MessageData {
  body: {
    content: string;
    senderId: number | null; // 수정된 부분
    createdAt?: string;
  }; // 필요한 다른 필드
}
// console.log(MessageBubble);

const ChatRoom = () => {
  // URL의 searchParams를 사용해 roomId를 가져옵니다.
  const [searchParams] = useSearchParams();

  // Recoil 상태 관리 라이브러리를 사용해 현재 채팅방의 ID를 가져옵니다.
  const chatRoomIdFromState = useRecoilValue(currentChatRoomIdState);

  // URL의 searchParams에서 roomId를 가져오거나, 없을 경우 Recoil로부터 가져온 chatRoomId를 사용합니다.
  const roomId = searchParams.get("roomId") || chatRoomIdFromState;

  // 채팅 메시지를 관리하는 로컬 상태입니다.
  const [messages, setMessages] = useState<MessageData[]>([]);

  // WebStomp 클라이언트 인스턴스를 관리하는 로컬 상태입니다.
  const [client, setClient] = useState<Webstomp.Client | null>(null);

  // WebSocket 연결 상태를 관리하는 Recoil 상태입니다.
  const [, setIsConnected] = useRecoilState(webSocketConnectionState);

  // 채팅 리스트를 관리하는 Recoil 상태입니다.
  const [, setChatList] = useRecoilState(chatState);

  // 현재 시간을 YYYY년 MM월 DD일 a hh시 mm분 형식으로 가져옵니다.
  const currentTime = moment().format("YYYY년 MM월 DD일 a hh시 mm분");

  // 로컬 스토리지에서 userId 값을 가져옵니다.
  const userIdFromLocalStorage = localStorage.getItem("Id");

  // 문자열을 숫자로 변환합니다. 로컬 스토리지에 값이 없으면 null로 설정합니다.
  const Id = userIdFromLocalStorage ? parseInt(userIdFromLocalStorage, 10) : null;

  useEffect(() => {
    // 이전 메시지를 초기화합니다.
    setMessages([]);

    if (roomId) {
      const socket = new WebSocket(process.env.REACT_APP_WEB_SOCKET_URL as string);
      const stompClient = Webstomp.over(socket);

      stompClient.connect(
        {},
        () => {
          // 소켓 연결 확인 로그
          console.log("Connected to the WebSocket server");
          setIsConnected(true); // 연결되면 상태를 true로 변경
          // ...

          // 채팅 구독 메세지를 화면에 띄어줌
          stompClient.subscribe(`/topic/chat/${roomId}`, (message) => {
            const messageData: MessageData = JSON.parse(message.body);
            setMessages((prevMessages) => [...prevMessages, messageData]);
            setChatList((prevChatList) => [...prevChatList, messageData]); // 이 부분을 추가
          });
          // console.log(stompClient);
        },
        (error) => {
          console.error("STOMP protocol error:", error); // 에러 로깅
          setIsConnected(false); // 에러가 발생하면 상태를 false로 변경
        },
      );

      setClient(stompClient);

      // 소켓 닫기 확인 로그
      return () => {
        stompClient.disconnect(() => {
          console.log("Disconnected from the WebSocket server");
          setIsConnected(false); // 닫기가 발생하면 상태를 false로 변경
        });
      };
    }
  }, [roomId]);

  useEffect(() => {
    const element = document.querySelector(".chatBox");
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  // InPut 내용을 소켓으로 Send
  const handleSendMessage = (message: string) => {
    console.log("handleSendMessage called with message:", message);
    if (client && client.connected) {
      client.send(`/app/chat/${roomId}`, JSON.stringify({ content: message, senderId: Id }), {});
      console.log("Message sent:", message);
    }
  };

  return (
    <>
      <Container>
        <div className="chatBox" style={{ display: "flex", flexDirection: "column" }}>
          <div className="startText">
            {" 어서오세요! \n 채팅을 시작해 보세요 "}
            <div className="date"> {`- 현재 시간은 ${currentTime} 입니다. -`}</div>
          </div>
          <ChatRoomHttp />
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              owner={message.body.senderId === Id ? "user" : "other"}
              message={message.body.content}
              time={FormatTimeOrDate(message.body.createdAt || null) || "Unknown time"}
            />
          ))}
        </div>
        <ChatInput onSendMessage={handleSendMessage} />
      </Container>
    </>
  );
};

export default ChatRoom;
