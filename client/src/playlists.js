import { Container, Row, Col } from 'react-bootstrap';

export default function Playlists({
	setChosenPlaylistID,
	playlists,
	chosenPlaylistID,
}) {
	return (
		<Container fluid style={{ paddingTop: '10px' }}>
			<Row>
				{playlists.map((playlist) => (
					<Col xs={4} sm={3} md={2} lg={2} key={playlist.id}>
						<img
							src={
								'images' in playlist
									? playlist.images.length > 0
										? 'url' in playlist.images[0]
											? playlist.images[0].url
											: 'https://community.spotify.com/t5/image/serverpage/image-id/25294i2836BD1C1A31BDF2?v=v2'
										: 'https://community.spotify.com/t5/image/serverpage/image-id/25294i2836BD1C1A31BDF2?v=v2'
									: 'https://community.spotify.com/t5/image/serverpage/image-id/25294i2836BD1C1A31BDF2?v=v2'
							}
							alt="playlist cover"
							id={playlist.id}
							style={{
								width: '10vw',
								height: '10vw',
								objectFit: 'cover',
								cursor: 'pointer',
								borderRadius: '5px',
								minWidth: '100px',
								minHeight: '100px',
							}}
							onClick={() => {
								if (
									(chosenPlaylistID !== '') &
									(chosenPlaylistID !== playlist.id)
								) {
									document
										.getElementById(chosenPlaylistID)
										.classList.remove('active');
								}
								setChosenPlaylistID(playlist.id);
							}}
						/>
						<p
							onClick={() => {
								if (
									chosenPlaylistID !== '' &&
									chosenPlaylistID !== playlist.id
								) {
									document
										.getElementById(chosenPlaylistID)
										.classList.remove('active');
								}
								setChosenPlaylistID(playlist.id);
							}}
							style={{ fontSize: '1.0rem', cursor: 'pointer' }}
						>
							{playlist.name.length > 20
								? playlist.name.substring(0, 20)
								: playlist.name}
						</p>
					</Col>
				))}
			</Row>
		</Container>
	);
}
