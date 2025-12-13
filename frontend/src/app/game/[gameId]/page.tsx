export default function GamePage({ params }: { params: { gameId: string } }) {
  return (
    <main>
      <h1>Game: {params.gameId}</h1>
      <p>Game board will be here</p>
    </main>
  );
}

