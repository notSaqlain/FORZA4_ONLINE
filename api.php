<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

$usersFile = 'users.json';

function getUsers() {
    global $usersFile;
    if (!file_exists($usersFile)) {
        return [];
    }
    $content = file_get_contents($usersFile);
    return json_decode($content, true) ?: [];
}

function saveUsers($users) {
    global $usersFile;
    file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));
}

function generateRandomPfp() {
    // Generate a random color for the avatar
    $colors = ['#e74c3c', '#f1c40f', '#3498db', '#9b59b6', '#2ecc71', '#e67e22'];
    $color = $colors[array_rand($colors)];
    return [
        'type' => 'color',
        'value' => $color
    ];
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'register') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Username and password required']);
        exit;
    }

    $users = getUsers();
    foreach ($users as $user) {
        if ($user['username'] === $username) {
            echo json_encode(['success' => false, 'message' => 'Username already exists']);
            exit;
        }
    }

    $pfpType = $_POST['pfp_type'] ?? 'color';
    $pfpValue = $_POST['pfp_value'] ?? '';
    
    $pfp = [];
    if ($pfpType === 'image' && !empty($pfpValue)) {
        $pfp = ['type' => 'image', 'value' => $pfpValue];
    } elseif ($pfpType === 'color' && !empty($pfpValue)) {
        $pfp = ['type' => 'color', 'value' => $pfpValue];
    } else {
        $pfp = generateRandomPfp();
    }

    $newUser = [
        'username' => $username,
        'password' => $password, // In production, hash this!
        'pfp' => $pfp,
        'stats' => ['wins' => 0, 'losses' => 0]
    ];

    $users[] = $newUser;
    saveUsers($users);

    echo json_encode(['success' => true, 'user' => $newUser]);

} elseif ($action === 'login') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    $users = getUsers();
    foreach ($users as $user) {
        if ($user['username'] === $username && $user['password'] === $password) {
            echo json_encode(['success' => true, 'user' => $user]);
            exit;
        }
    }

    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);

} elseif ($action === 'update_stats') {
    $username = $_POST['username'] ?? '';
    $win = $_POST['win'] ?? false; // true if win, false if loss

    $users = getUsers();
    $found = false;
    foreach ($users as &$user) {
        if ($user['username'] === $username) {
            if ($win === 'true') {
                $user['stats']['wins']++;
            } else {
                $user['stats']['losses']++;
            }
            $found = true;
            break;
        }
    }

    if ($found) {
        saveUsers($users);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'User not found']);
    }

} else {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>
