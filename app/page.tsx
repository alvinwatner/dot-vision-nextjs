"use client"

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [dots, setDots] = useState<number[][]>(Array.from({ length: 2 }, () => [0, 0]));
  const dotContainerRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const useDummyData = true; // Set to false when websocket is available

    if (useDummyData) {
      const interval = setInterval(() => {
        if (typeof window !== 'undefined' && dotContainerRef.current) {
          const container = (dotContainerRef.current as HTMLElement).getBoundingClientRect();
          setDots((prevDots) =>
            prevDots.map(([x, y]) => {
              const newX = Math.min(Math.max(x + (Math.random() - 0.5) * 20, 0), container.width);
              const newY = Math.min(Math.max(y + (Math.random() - 0.5) * 20, 0), container.height);
              return [newX, newY];
            })
          );
        }
      }, 200);

      return () => clearInterval(interval);
    } else {
      const socket = io('http://your-backend-url');

      socket.on('dotData', (data) => {
        setDots(data.result);
      });

      return () => socket.disconnect();
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setScrollY(window.scrollY);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const zoomOutScale = typeof window !== 'undefined' ? Math.max(2 - scrollY / window.innerHeight, 0.4) : 2;
  const rectangleZoomOutScale = typeof window !== 'undefined' ? Math.max(2 - scrollY / (2 * window.innerHeight), 0.4) : 2;

  return (
    <div className="h-[200vh]">
      <div className="sticky top-0 w-full h-screen overflow-hidden transform origin-center transition-transform duration-500 ease-out" style={{ transform: `scale(${rectangleZoomOutScale})` }}>
        <Image src="/wall.jpeg" alt="Background" layout="fill" objectFit="cover" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[40%] h-[40%] bg-white border-4 border-black transform transition-transform duration-500 ease-out" ref={dotContainerRef} style={{ transform: `scale(${zoomOutScale})` }}>
            <DotDisplay dots={dots} />
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-center text-black mt-2">
              <h1 className="text-2xl font-bold">.vision</h1>
            </div>
          </div>
        </div>
      </div>
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
