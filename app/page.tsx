"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [dots, setDots] = useState<number[][]>(
    Array.from({ length: 2 }, () => [0, 0])
  );
  const dotContainerRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const useDummyData = true;

  const sendFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = canvas.toDataURL("image/png");
        const encodedBase64Image = frameData.split(",")[1]; // Remove the data URL prefix

        // Get the image width and height
        const imageWidth = canvas.width;
        const imageHeight = canvas.height;

        // Log the image width and height
        console.log("Image Width:", imageWidth, "Image Height:", imageHeight);

        // Log the frame size and base64 image
        // console.log("Base64 Image:", encodedBase64Image);

        return encodedBase64Image;
      }
    }
    return null;
  };

  useEffect(() => {
    if (useDummyData) {
      const interval = setInterval(
        () => {
          if (typeof window !== "undefined" && dotContainerRef.current) {
            const container = (
              dotContainerRef.current as HTMLElement
            ).getBoundingClientRect();
            setDots((prevDots) =>
              prevDots.map(([x, y]) => {
                const newX = Math.min(
                  Math.max(x + (Math.random() - 0.5) * 20, 0),
                  container.width
                );
                const newY = Math.min(
                  Math.max(y + (Math.random() - 0.5) * 20, 0),
                  container.height
                );
                return [newX, newY];
              })
            );
          }
          // Call sendFrame regardless of useDummyData state
          const encodedBase64Image = sendFrame();
          if (encodedBase64Image) {
            console.log("Frame captured during dummy data mode.");
          }
        },

        200
      );

      return () => clearInterval(interval);
    } else {
      const socket = io("http://your-backend-url");

      const interval = setInterval(() => {
        const encodedBase64Image = sendFrame();
        if (encodedBase64Image) {
          socket.emit("frameData", { frame: encodedBase64Image });
        }
      }, 1000 / 30); // Send 30 frames per second

      return () => {
        clearInterval(interval);
        socket.disconnect();
      };
    }
  }, [useDummyData]);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        setScrollY(window.scrollY);

        if (dotContainerRef.current) {
          const { width, height } = (
            dotContainerRef.current as HTMLElement
          ).getBoundingClientRect();
          console.log("DotContainer width:", width, "height:", height);
        }
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const zoomOutScale =
    typeof window !== "undefined"
      ? Math.max(2 - scrollY / window.innerHeight, 0.4)
      : 2;
  const rectangleZoomOutScale =
    typeof window !== "undefined"
      ? Math.max(2 - scrollY / (2 * window.innerHeight), 0.4)
      : 2;

  return (
    <div className="h-[200vh]">
      <div
        className="sticky top-0 w-full h-screen overflow-hidden transform origin-center transition-transform duration-500 ease-out"
        style={{ transform: `scale(${rectangleZoomOutScale})` }}
      >
        <Image
          src="/wall.jpeg"
          alt="Background"
          layout="fill"
          objectFit="cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative w-[40%] h-[40%] bg-white border-4 border-black transform transition-transform duration-500 ease-out"
            ref={dotContainerRef}
            style={{ transform: `scale(${zoomOutScale})` }}
          >
            <DotDisplay dots={dots} />
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-center text-black mt-2">
              <h1 className="text-2xl font-bold">.vision</h1>
            </div>
          </div>
        </div>
      </div>
      <video
        ref={videoRef}
        src="/nick_room-6.mkv"
        className="fixed top-0 right-0 w-1/6 h-auto"
        autoPlay
        muted
        loop
      />
      <canvas ref={canvasRef} className="hidden" width={640} height={360} />
    </div>
  );
}

function DotDisplay({ dots }: { dots: number[][] }) {
  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
      {dots.map((dot, index) => (
        <div
          key={index}
          className="absolute w-6 h-6 bg-black rounded-full"
          style={{ left: `${dot[0]}px`, top: `${dot[1]}px` }}
        ></div>
      ))}
    </div>
  );
}
