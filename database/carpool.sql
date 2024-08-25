-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 02, 2024 at 02:41 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `carpool`
--
CREATE DATABASE IF NOT EXISTS `carpool` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `carpool`;
-- --------------------------------------------------------

--
-- Table structure for table `carpools`
--

CREATE TABLE `carpools` (
  `id` int(11) NOT NULL,
  `carpool_title` varchar(255) NOT NULL,
  `carpool_type` varchar(255) NOT NULL,
  `carpool_status` varchar(255) NOT NULL,
  `carpool_from` varchar(255) NOT NULL,
  `carpool_fromLat` decimal(23,20) NOT NULL,
  `carpool_fromLon` decimal(23,20) NOT NULL,
  `carpool_to` varchar(255) NOT NULL,
  `carpool_toLat` decimal(23,20) NOT NULL,
  `carpool_toLon` decimal(23,20) NOT NULL,
  `carpool_dateTime` datetime NOT NULL,
  `carpool_price` decimal(10,2) NOT NULL,
  `carpool_totalSeats` int(11) NOT NULL,
  `carpool_takenSeats` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat`
--

CREATE TABLE `chat` (
  `id` int(11) NOT NULL,
  `carpool_id` int(11) NOT NULL,
  `message_type` varchar(255) NOT NULL,
  `sender_email` varchar(255) NOT NULL,
  `message_content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dateTime` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `id` int(11) NOT NULL,
  `driver_email` varchar(255) NOT NULL,
  `car_model` varchar(255) NOT NULL,
  `car_year` year(4) NOT NULL,
  `car_color` varchar(255) NOT NULL,
  `car_vin` varchar(17) NOT NULL,
  `car_number` varchar(12) NOT NULL,
  `driver_license_exp_date` date NOT NULL,
  `driver_license_issue_country` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driver_update`
--

CREATE TABLE `driver_update` (
  `id` int(11) NOT NULL,
  `driver_email` varchar(255) NOT NULL,
  `car_model` varchar(255) NOT NULL,
  `car_year` year(4) NOT NULL,
  `car_color` varchar(255) NOT NULL,
  `car_vin` varchar(17) NOT NULL,
  `car_number` varchar(12) NOT NULL,
  `driver_license_exp_date` date NOT NULL,
  `driver_license_issue_country` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_members`
--

CREATE TABLE `group_members` (
  `id` int(11) NOT NULL,
  `carpool_id` int(11) NOT NULL,
  `member_email` varchar(255) NOT NULL,
  `member_name` varchar(255) NOT NULL,
  `isDriver` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `join_requests`
--

CREATE TABLE `join_requests` (
  `id` int(11) NOT NULL,
  `carpool_id` int(11) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `request_status` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rating`
--

CREATE TABLE `rating` (
  `id` int(11) NOT NULL,
  `carpool_id` int(11) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `isRated` tinyint(4) NOT NULL DEFAULT 0,
  `uuid` varchar(255) NOT NULL,
  `expiration_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reset_password`
--

CREATE TABLE `reset_password` (
  `id` int(11) NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `expiration_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rewards`
--

CREATE TABLE `rewards` (
  `id` int(11) NOT NULL,
  `reward_title` varchar(255) NOT NULL,
  `reward_description` text NOT NULL,
  `reward_category` varchar(255) NOT NULL,
  `reward_available_num` int(11) NOT NULL,
  `reward_redeem_points` int(11) NOT NULL,
  `reward_status` varchar(255) NOT NULL,
  `reward_poster` varchar(255) DEFAULT NULL,
  `reward_card_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_gender` enum('male','female') NOT NULL,
  `user_email` varchar(255) NOT NULL,
  `user_role` varchar(20) NOT NULL DEFAULT 'Student',
  `user_contactNo` varchar(15) NOT NULL,
  `user_point` int(11) NOT NULL DEFAULT 0,
  `user_exp` int(11) NOT NULL DEFAULT 0,
  `user_rating` decimal(3,1) NOT NULL,
  `user_rated` int(11) NOT NULL,
  `user_status` varchar(255) NOT NULL DEFAULT 'Active',
  `user_password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `user_name`, `user_gender`, `user_email`, `user_role`, `user_contactNo`, `user_point`, `user_exp`, `user_rating`, `user_rated`, `user_status`, `user_password`) VALUES
(1, 'Admin', 'male', 'chongminghong34@gmail.com', 'Admin', '+60165421307', 0, 0, 5.0, 0, 'Active', '$2b$10$bD23t.QluDVBa/mvY6L48eRGly8VF0hG6FoSS.0LjAp9SIMzWoTV6');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `carpools`
--
ALTER TABLE `carpools`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chat`
--
ALTER TABLE `chat`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `driver_update`
--
ALTER TABLE `driver_update`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `group_members`
--
ALTER TABLE `group_members`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `join_requests`
--
ALTER TABLE `join_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rating`
--
ALTER TABLE `rating`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reset_password`
--
ALTER TABLE `reset_password`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `rewards`
--
ALTER TABLE `rewards`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `carpools`
--
ALTER TABLE `carpools`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `chat`
--
ALTER TABLE `chat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `driver_update`
--
ALTER TABLE `driver_update`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `group_members`
--
ALTER TABLE `group_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `join_requests`
--
ALTER TABLE `join_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `rating`
--
ALTER TABLE `rating`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `reset_password`
--
ALTER TABLE `reset_password`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `rewards`
--
ALTER TABLE `rewards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
