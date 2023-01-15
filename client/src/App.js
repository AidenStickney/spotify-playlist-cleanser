import axios from 'axios';
import { useState, useEffect } from 'react';
import { accessToken, logout } from './spotify';
import Playlists from './playlists';
import { Button } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
	const [token, setToken] = useState(null);
	const [playlists, setPlaylists] = useState([]);
	const [currentUserID, setCurrentUserID] = useState('');
	const [chosenPlaylistID, setChosenPlaylistID] = useState('');
	const [newPlaylistID, setNewPlaylistID] = useState('');
	const [chosenPlaylist, setChosenPlaylist] = useState(null);
	const [cleansing, setCleansing] = useState(false);
	const [currentSongImage, setcurrentSongImage] = useState('');
	const [currentSongName, setcurrentSongName] = useState('');
	const [currentSongArtist, setcurrentSongArtist] = useState('');
	const [currentSongPlace, setcurrentSongPlace] = useState(0);
	const [tracks, setTracks] = useState([]);

	const timeout = (ms) => {
		return new Promise((resolve) => setTimeout(resolve, ms));
	};

	const LOGIN_URI =
		process.env.NODE_ENV !== 'production'
			? 'http://localhost:8888/login'
			: 'https://spotify-playlist-cleanser.herokuapp.com/login';

	const activateCleansing = () => {
		setCleansing(true);
		createPlaylist();
	};

	const getPlaylists = async (offset) => {
		if (offset === 0) {
			setPlaylists([]);
		}
		const { data } = await axios.get(
			`https://api.spotify.com/v1/me/playlists?limit=20&offset=${offset}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);
		if (currentUserID !== '') {
			data.items = data.items.filter(
				(playlist) => playlist.owner.id === currentUserID
			);
		}
		data.items = data.items.filter(
			(playlist) => playlist.id !== playlists.find((p) => p.id === playlist.id)
		);
		data.items.forEach((playlist) => {
			playlist.key = playlist.id;
		});
		setPlaylists((playlists) => [...playlists, ...data.items]);
		if (data.next !== null) {
			getPlaylists(offset + 20);
		}
	};

	const searchSong = async (song) => {
		const { data } = await axios.get(
			`https://api.spotify.com/v1/search?q=${song}&type=track`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);
		return data;
	};

	const addSong = async (song, newPlaylistID) => {
		const { data } = await axios.post(
			`https://api.spotify.com/v1/playlists/${newPlaylistID}/tracks?uris=${song}`,
			{},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);
	};

	const createPlaylist = async () => {
		const { data } = await axios.post(
			`https://api.spotify.com/v1/users/${chosenPlaylist.owner.id}/playlists`,
			{
				name: chosenPlaylist.name + ' Cleansed',
				description: 'Cleansed',
				public: false,
			},
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);
		setNewPlaylistID(data.id);
	};

	const getTracks = async (offset) => {
		let allTracks = [];
		const { data } = await axios.get(
			`https://api.spotify.com/v1/playlists/${chosenPlaylistID}/tracks?offset=${offset}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);
		allTracks = [...allTracks, ...data.items];
		if (data.next !== null) {
			let newData = await getTracks(offset + 100);
			allTracks = [...allTracks, ...newData];
		}
		return allTracks;
	};

	const getCurrentUser = async () => {
		const { data } = await axios.get('https://api.spotify.com/v1/me', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		setCurrentUserID(data.id);
	};

	const timer = (ms) => new Promise((res) => setTimeout(res, ms));

	const cleanse = async () => {
		for (const track of tracks) {
			setcurrentSongName(track.track.name);
			setcurrentSongArtist(track.track.artists[0].name);
			setcurrentSongPlace(tracks.indexOf(track) + 1);
			if ('album' in track.track) {
				if ('images' in track.track.album) {
					if (track.track.album.images.length > 0) {
						if ('url' in track.track.album.images[0]) {
							setcurrentSongImage(track.track.album.images[0].url);
						}
					}
				}
			}
			if (!track.track.explicit) {
				addSong(track.track.uri, newPlaylistID);
			} else {
				let results = searchSong(track.track.name, track.track.artists[0].name);
				results.then((data) => {
					if (data.tracks.items.length > 0) {
						let filtered = data.tracks.items.filter(
							(item) =>
								!item.explicit &&
								item.artists[0].name == track.track.artists[0].name
						);
						if (filtered.length > 0) {
							addSong(filtered[0].uri, newPlaylistID);
						}
					}
				});
			}
			await timer(1000);
		}
		setCleansing(false);
		setTracks([]);
		setcurrentSongArtist('');
		setcurrentSongImage('');
		setcurrentSongName('');
		setcurrentSongPlace(0);
	};

	useEffect(() => {
		if (!cleansing && newPlaylistID !== '') {
			getPlaylists(0).then(() => {
				setChosenPlaylist(playlists[0]);
				setChosenPlaylistID(playlists[0].id);
			});
		}
	}, [cleansing]);

	useEffect(() => {
		if (tracks !== undefined) {
			if (tracks.length > 0) cleanse();
		}
	}, [tracks]);

	useEffect(() => {
		if (newPlaylistID !== '') {
			let data = getTracks(0);
			data.then((data) => {
				setTracks(data);
			});
		}
	}, [newPlaylistID]);

	useEffect(() => {
		if (playlists.length > 0) {
			setChosenPlaylist(playlists[0]);
			setChosenPlaylistID(playlists[0].id);
			let elements = document.getElementsByClassName('active');
			for (let element in elements) {
				try {
					element.classList.remove('active');
				} catch (err) {}
			}
		}
	}, [playlists]);

	useEffect(() => {
		getCurrentUser().then(() => {
			getPlaylists(0);
		});
		setToken(accessToken);
	}, []);

	useEffect(() => {
		try {
			let playlist = playlists.find(({ id }) => id === chosenPlaylistID);
			let elements = document.getElementsByClassName('active');
			for (let element in elements) {
				try {
					element.classList.remove('active');
				} catch (err) {}
			}
			setChosenPlaylist(playlist);
			document.getElementById(chosenPlaylistID).classList.add('active');
		} catch (err) {}
	}, [chosenPlaylistID]);

	return (
		<div className="App">
			<header className="App-header">
				{!token ? (
					<div class="container">
						<Button
							variant="success"
							size="lg"
							href={LOGIN_URI}
							style={{ margin: 'auto' }}
						>
							Log in to Spotify
						</Button>
					</div>
				) : (
					<div className="container">
						{!cleansing ? (
							<>
								{playlists.length > 0 ? (
									<>
										<p style={{ marginBottom: '1vh' }}>
											Which playlist to cleanse?
										</p>
										<div className="overflow-auto">
											<Playlists
												playlists={playlists}
												setChosenPlaylistID={setChosenPlaylistID}
												chosenPlaylistID={chosenPlaylistID}
											/>
										</div>
										<Button
											variant="light"
											onClick={activateCleansing}
											style={{ marginTop: '1vh', marginBottom: '1vh' }}
										>
											Cleanse
										</Button>
										<button
											className="logout"
											onClick={logout}
											style={{ fontSize: '11px' }}
										>
											Log Out
										</button>
									</>
								) : (
									<div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
										<p>Please Login Again</p>
										<Button variant="light" onClick={logout}>
											Log Out
										</Button>
									</div>
								)}
							</>
						) : (
							<>
								<p style={{ position: 'absolute', top: '0' }}>Cleansing...</p>
								<div className="cleansing-container">
									<img
										className="image"
										src={currentSongImage}
										style={{ marginTop: '0' }}
									/>
									<p style={{ marginBottom: '0' }}>{currentSongName}</p>
									<small>
										<p style={{ marginBottom: '0' }}>{currentSongArtist}</p>
									</small>
									{tracks.length > 0 ? (
										<small>
											<p style={{ marginBottom: '0' }}>
												{currentSongPlace}/{tracks.length}
											</p>
										</small>
									) : null}
								</div>
							</>
						)}
					</div>
				)}
				<FaGithub
					onClick={() =>
						window.open(
							'https://github.com/AidenStickney/spotify-playlist-cleanser'
						)
					}
					style={{
						position: 'absolute',
						bottom: '0',
						right: '0',
						height: '3vh',
						width: '3vh',
						margin: '1.1vh',
						cursor: 'pointer',
					}}
				/>
			</header>
		</div>
	);
}

export default App;
