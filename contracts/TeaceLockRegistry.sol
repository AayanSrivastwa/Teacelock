// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TeaceLockRegistry
 * @dev Cryptographic authenticity ledger and supply chain provenance registry.
 * Records SHA-256 state hashes, brand identity, and status transitions on-chain.
 */
contract TeaceLockRegistry {
    address public owner;

    enum ProductStatus { Active, Flagged, Recalled, Retired }

    struct Product {
        string productCode;
        string name;
        string brand;
        bytes32 productHash;
        ProductStatus status;
        uint256 registeredAt;
        address registeredBy;
        bool exists;
    }

    struct SupplyChainMilestone {
        string eventType;
        string location;
        string actorName;
        string notes;
        uint256 timestamp;
        address recordedBy;
    }

    // productCode => Product
    mapping(string => Product) private products;
    // productCode => array of Milestones
    mapping(string => SupplyChainMilestone[]) private milestones;

    // Authorized manufacturers/admins
    mapping(address => bool) public authorizedCallers;

    event ProductRegistered(
        string indexed productCode,
        string name,
        string brand,
        bytes32 productHash,
        uint256 timestamp,
        address indexed registeredBy
    );

    event StatusChanged(
        string indexed productCode,
        ProductStatus newStatus,
        uint256 timestamp,
        address indexed updatedBy
    );

    event MilestoneRecorded(
        string indexed productCode,
        string eventType,
        string location,
        string actorName,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedCallers[msg.sender], "Not authorized to write to ledger");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedCallers[msg.sender] = true;
    }

    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        authorizedCallers[caller] = authorized;
    }

    /**
     * @notice Registers a new physical product on the blockchain with its SHA-256 digest
     */
    function registerProduct(
        string calldata productCode,
        string calldata name,
        string calldata brand,
        bytes32 productHash
    ) external onlyAuthorized {
        require(!products[productCode].exists, "Product code already registered");
        require(bytes(productCode).length > 0, "Product code cannot be empty");

        products[productCode] = Product({
            productCode: productCode,
            name: name,
            brand: brand,
            productHash: productHash,
            status: ProductStatus.Active,
            registeredAt: block.timestamp,
            registeredBy: msg.sender,
            exists: true
        });

        // Add genesis milestone
        milestones[productCode].push(SupplyChainMilestone({
            eventType: "MANUFACTURED",
            location: "Genesis Factory Node",
            actorName: brand,
            notes: "Genesis product hash anchored on blockchain.",
            timestamp: block.timestamp,
            recordedBy: msg.sender
        }));

        emit ProductRegistered(productCode, name, brand, productHash, block.timestamp, msg.sender);
    }

    /**
     * @notice Updates status (Active, Flagged, Recalled, Retired)
     */
    function updateProductStatus(string calldata productCode, ProductStatus newStatus) external onlyAuthorized {
        require(products[productCode].exists, "Product does not exist");
        products[productCode].status = newStatus;

        emit StatusChanged(productCode, newStatus, block.timestamp, msg.sender);
    }

    /**
     * @notice Records a custody/checkpoint milestone in the supply chain
     */
    function recordMilestone(
        string calldata productCode,
        string calldata eventType,
        string calldata location,
        string calldata actorName,
        string calldata notes
    ) external onlyAuthorized {
        require(products[productCode].exists, "Product does not exist");

        milestones[productCode].push(SupplyChainMilestone({
            eventType: eventType,
            location: location,
            actorName: actorName,
            notes: notes,
            timestamp: block.timestamp,
            recordedBy: msg.sender
        }));

        emit MilestoneRecorded(productCode, eventType, location, actorName, block.timestamp);
    }

    /**
     * @notice Public verification method: retrieve full authenticity state
     */
    function verifyProduct(string calldata productCode) external view returns (
        bool exists,
        string memory name,
        string memory brand,
        bytes32 productHash,
        ProductStatus status,
        uint256 registeredAt,
        address registeredBy,
        uint256 milestoneCount
    ) {
        Product memory p = products[productCode];
        if (!p.exists) {
            return (false, "", "", bytes32(0), ProductStatus.Active, 0, address(0), 0);
        }
        return (
            true,
            p.name,
            p.brand,
            p.productHash,
            p.status,
            p.registeredAt,
            p.registeredBy,
            milestones[productCode].length
        );
    }

    /**
     * @notice Returns milestone details by index for transparency
     */
    function getMilestone(string calldata productCode, uint256 index) external view returns (
        string memory eventType,
        string memory location,
        string memory actorName,
        string memory notes,
        uint256 timestamp,
        address recordedBy
    ) {
        require(products[productCode].exists, "Product does not exist");
        require(index < milestones[productCode].length, "Index out of range");

        SupplyChainMilestone memory m = milestones[productCode][index];
        return (m.eventType, m.location, m.actorName, m.notes, m.timestamp, m.recordedBy);
    }
}
