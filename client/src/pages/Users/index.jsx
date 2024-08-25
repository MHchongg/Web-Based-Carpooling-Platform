import { useState } from 'react';
import { useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';
import { orange } from '@mui/material/colors';
import { Box, Avatar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Button, InputBase, IconButton, Stack, TableFooter, TablePagination } from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import UserModal from "../../components/UserModal";
import { stringAvatar } from '../../utils';
import emptyBox from "../../assets/empty-box.png"
import './index.scss'

const MyButton = styled(Button)(({ theme }) => ({
    backgroundColor: orange[500],
    color: 'white',
    '&:hover': {
        backgroundColor: orange[700],
    },
}));


const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: orange[500],
        color: theme.palette.common.white,
        fontWeight: 'bold',
        fontSize: 18,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        fontWeight: 'bold'
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },

    '&:hover': {
        backgroundColor: '#ececec'
    }
}));

const Users = () => {

    const { userList } = useSelector(state => state.admin)

    const [userModal, setUserModal] = useState({ isDisplay: false, isAdmin: true, userInfo: {}, Avatar: <></> })
    const [searchValue, setSearchValue] = useState("")
    const [tablePage, setTablePage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [tableCount, setTableCount] = useState(userList.length)

    const handleUserModalClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setUserModal({ isDisplay: false, isAdmin: true, userInfo: {}, Avatar: <></> })
    };

    const handleSearchValueChange = (event) => {
        setSearchValue(event.target.value)
        setTableCount(userList.filter((user) => { return user.user_email.includes(event.target.value)}).length)
    }

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setTablePage(0);
    };

    return (
        <Box width={'100%'} display={'flex'} justifyContent={'center'} marginTop={'1.5rem'} marginBottom={'1.5rem'}>
            <Box id="user-list-container">
                <Typography textAlign={'center'} fontWeight={'bold'} fontSize={'xx-large'} marginBottom={'1rem'} color={'#6f8b90'}>Users</Typography>

                <Paper sx={{ p: '2px 4px', boxShadow: 'none', display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem', backgroundColor: '#dddddd', borderRadius: '15px' }} component="div">
                    <InputBase
                        sx={{ ml: 1, flex: 1, fontWeight: 'bold' }}
                        placeholder="Search User by email"
                        inputProps={{ 'aria-label': 'search user' }}
                        onChange={(event) => handleSearchValueChange(event)}
                        value={searchValue}
                    />

                    <IconButton type="button" sx={{ p: '10px' }} aria-label="search" disabled>
                        <SearchRoundedIcon />
                    </IconButton>
                </Paper>

                {
                userList.length <= 0 ?
                    <Stack width={'100%'} alignItems={'center'} spacing={2}>
                        <Typography variant="h5" fontWeight={'bold'}>No user</Typography>
                        <img src={emptyBox} alt='no users' style={{ width: '20rem' }}></img>
                    </Stack>
                :
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 700 }} aria-label="customized table">
                            <TableHead>
                                <TableRow>
                                    <StyledTableCell>User</StyledTableCell>
                                    <StyledTableCell align="center">Name</StyledTableCell>
                                    <StyledTableCell align="center">Email</StyledTableCell>
                                    <StyledTableCell align="center">Role</StyledTableCell>
                                    <StyledTableCell align="center">Status</StyledTableCell>
                                    <StyledTableCell align="center"></StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(rowsPerPage > 0
                                    ? userList.filter((user) => { return user.user_email.includes(searchValue) }).slice(tablePage * rowsPerPage, tablePage * rowsPerPage + rowsPerPage)
                                    : userList.filter((user) => { return user.user_email.includes(searchValue) })
                                ).map((user) => (
                                    <StyledTableRow key={user.id}>
                                        <StyledTableCell component="th" scope="row">
                                            <Avatar {...stringAvatar(user.user_name)} />
                                        </StyledTableCell>
                                        <StyledTableCell align="center">{user.user_name}</StyledTableCell>
                                        <StyledTableCell align="center">{user.user_email}</StyledTableCell>
                                        <StyledTableCell align="center">{user.user_role}</StyledTableCell>
                                        <StyledTableCell align="center" sx={{ color: user.user_status === "Active" ? "green" : "red" }}>
                                            {user.user_status}
                                        </StyledTableCell>
                                        <StyledTableCell align="center">
                                            <MyButton onClick={() => {
                                                setUserModal({
                                                    isDisplay: true,
                                                    isAdmin: true,
                                                    userInfo: {
                                                        user_email: user.user_email,
                                                        user_name: user.user_name,
                                                    },
                                                    Avatar: <Avatar {...stringAvatar(user.user_name)} />
                                                })
                                            }}>
                                                View
                                            </MyButton>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow>
                                    <TablePagination
                                        count={tableCount}
                                        rowsPerPageOptions={[]}
                                        rowsPerPage={rowsPerPage}
                                        page={tablePage}
                                        onPageChange={(event, value) => setTablePage(value)}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                    />
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </TableContainer>
                }
            </Box>
            {userModal.isDisplay && <UserModal userModal={userModal} handleUserModalClose={handleUserModalClose} />}
        </Box>
    );
}

export default Users